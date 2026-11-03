import type { Pool } from "pg";
import { z } from "zod";
import { verifyJournal, type RestrictionJournal, JournalEventSchema } from "./journal.js";

export const JournalHeadSchema = z.strictObject({
  sequence: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  checkpointSha256: z.string().regex(/^[a-f0-9]{64}$/),
});
/** Operator-only. The caller must fence writers outside the restored database first.
 * Require the independently obtained current head, never infer completeness from a prefix.
 */
export async function replayRestrictions(
  pool: Pool,
  journal: RestrictionJournal,
  keys: ReadonlyMap<string, Buffer>,
  expectedHead: z.infer<typeof JournalHeadSchema>,
) {
  const expected = JournalHeadSchema.parse(expectedHead);
  const entries = verifyJournal(await journal.read(), keys);
  const head = entries.at(-1);
  if (
    entries.length !== expected.sequence ||
    (head?.checkpointSha256 ?? "0".repeat(64)) !== expected.checkpointSha256
  )
    throw new Error("Independent journal head is incomplete.");
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_catalog.pg_advisory_xact_lock(1667328366,2)");
    const previous = await client.query(
      "SELECT sequence,checkpoint_sha256 FROM operations.recovery_checkpoint WHERE id=1 FOR UPDATE",
    );
    const applied = z.coerce.number().int().nonnegative().parse(previous.rows[0]?.sequence);
    if (
      applied > entries.length ||
      (applied ? entries[applied - 1]?.checkpointSha256 : "0".repeat(64)) !==
        previous.rows[0]?.checkpoint_sha256
    )
      throw new Error("Recovery checkpoint does not match independent history.");
    for (const entry of entries) {
      const event = JournalEventSchema.parse(JSON.parse(entry.body));
      await client.query("SELECT operations.replay_restriction($1::jsonb,$2,$3)", [
        JSON.stringify(event),
        entry.sequence,
        entry.checkpointSha256,
      ]);
    }
    const deniedAccounts = new Set(
      entries
        .map((entry) => JournalEventSchema.parse(JSON.parse(entry.body)))
        .filter((event) => event.resourceKind === "account")
        .map((event) => event.resourceId),
    );
    for (const id of deniedAccounts) {
      while (true) {
        const frozen = await client.query(
          "SELECT operations.freeze_recovered_administration($1) AS count",
          [id],
        );
        if (Number(frozen.rows[0]?.count) === 0) break;
      }
    }
    await client.query("COMMIT");
  } catch {
    discard = true;
    await client.query("ROLLBACK").catch(() => {});
    throw new Error("Restriction replay failed; keep delivery fenced.");
  } finally {
    client.release(discard);
  }
  return expected;
}
/** No row bodies, emails, sealed payloads, bearer receipts or source titles. Operator use only. */
export async function inspectOperation(
  pool: Pool,
  input: {
    operatorId: string;
    caseId: string;
    purpose: "support_case" | "incident_response" | "recovery" | "retention";
    operationId: string;
  },
) {
  const operator = z.uuid().parse(input.operatorId);
  const caseId = z.uuid().parse(input.caseId);
  const operation = z.uuid().parse(input.operationId);
  const purpose = z
    .enum(["support_case", "incident_response", "recovery", "retention"])
    .parse(input.purpose);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT state,recovery_state,revision,processed_units,total_units,error_code FROM operations.lifecycle_operation WHERE id=$1",
      [operation],
    );
    if (result.rowCount)
      await client.query(
        "INSERT INTO operations.audit_event(actor_kind,service_name,operator_id,inspection_purpose,case_id,action,target_id,revision,policy_generation) VALUES('operator','operator_console',$1,$2,$3,'operator.inspect',$4,1,1)",
        [operator, purpose, caseId, operation],
      );
    await client.query("COMMIT");
    return result.rows[0] ?? null;
  } catch {
    await client.query("ROLLBACK");
    throw new Error("Operator inspection unavailable.");
  } finally {
    client.release();
  }
}

const writerRoles = ["kairn_server", "kairn_auth", "kairn_worker"] as const;
/** Controlled operator principal only. Existing sessions and future logins are both fenced. */
export async function fenceDatabaseWriters(admin: Pool) {
  for (const role of writerRoles) await admin.query(`ALTER ROLE ${role} NOLOGIN`);
  await admin.query(
    "SELECT pg_catalog.pg_terminate_backend(pid) FROM pg_catalog.pg_stat_activity WHERE usename=ANY($1::text[]) AND pid<>pg_catalog.pg_backend_pid()",
    [writerRoles],
  );
  const remaining = await admin.query(
    "SELECT count(*)::int AS count FROM pg_catalog.pg_stat_activity WHERE usename=ANY($1::text[])",
    [writerRoles],
  );
  if (remaining.rows[0]?.count !== 0)
    throw new Error("Writer sessions remain; keep delivery fenced.");
}
export async function rotateWriterCredentials(
  admin: Pool,
  passwords: Record<(typeof writerRoles)[number], string>,
) {
  for (const role of writerRoles) {
    const password = z
      .string()
      .regex(/^[A-Za-z0-9_-]{43,128}$/)
      .parse(passwords[role]);
    await admin.query(`ALTER ROLE ${role} NOLOGIN PASSWORD '${password}'`);
  }
}
/** Caller must independently verify current compatible process images and new mounted credentials.
 * This function checks the restored database checkpoint, and keeps old passwords invalid.
 */
export async function releaseDatabaseWriters(
  admin: Pool,
  expected: z.infer<typeof JournalHeadSchema>,
) {
  const head = JournalHeadSchema.parse(expected);
  const current = await admin.query(
    "SELECT sequence,checkpoint_sha256 FROM operations.recovery_checkpoint WHERE id=1",
  );
  if (
    Number(current.rows[0]?.sequence) !== head.sequence ||
    current.rows[0]?.checkpoint_sha256 !== head.checkpointSha256
  )
    throw new Error("Replay boundary is unverified.");
  for (const role of writerRoles) await admin.query(`ALTER ROLE ${role} LOGIN`);
}

export const OperatorConfigSchema = z.strictObject({
  composeProject: z.string().regex(/^[a-z0-9][a-z0-9_-]+$/),
  composeFiles: z.array(z.string().min(1)).min(1),
  fenceDirectory: z.string().min(1),
  operatorDatabaseUrl: z.url(),
  journal: z.strictObject({
    endpoint: z.url(),
    token: z.string().min(32),
    keys: z.record(
      z.string().regex(/^[A-Za-z0-9.:-]{1,64}$/),
      z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    ),
  }),
  newWriterPasswordsFile: z.string(),
  releaseEvidenceFile: z.string(),
  newJournalAppenderTokenFile: z.string(),
  inspection: z
    .object({
      operatorId: z.uuid(),
      caseId: z.uuid(),
      purpose: z.enum(["support_case", "incident_response", "recovery", "retention"]),
      operationId: z.uuid(),
    })
    .optional(),
});
export const DockerContainersSchema = z.array(
  z.object({
    Id: z.string(),
    Image: z.string(),
    State: z.object({ Running: z.boolean() }),
    HostConfig: z.object({ RestartPolicy: z.object({ Name: z.string() }) }),
    Config: z.object({ Env: z.array(z.string()).nullable() }),
  }),
);
export const FenceStateSchema = z.object({
  state: z.enum(["closing", "fenced", "replayed", "rotated", "released"]),
  startedAt: z.string(),
  head: JournalHeadSchema.optional(),
});
export const ReleaseEvidenceSchema = z.strictObject({
  sequence: z.number().int().nonnegative(),
  checkpointSha256: z.string().regex(/^[a-f0-9]{64}$/),
  oldWriterCommitRejected: z.literal(true),
  oldWriterReconnectRejected: z.literal(true),
  objectIntegrityVerified: z.literal(true),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  compatibleImages: z.array(z.string().regex(/^sha256:[a-f0-9]{64}$/)).min(1),
});
export const WriterPasswordsSchema = z.strictObject({
  kairn_server: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
  kairn_auth: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
  kairn_worker: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
});
