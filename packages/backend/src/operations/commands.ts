import { createHmac, createHash, randomBytes, randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { DisplayNameSchema, BioSchema } from "@kairn/contracts";
import { runAsAccount, type AccountActor } from "../identity/context.js";
import type { startJobProducer } from "../job-producer.js";

const id = z.uuid();
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const bound = { journeyId: id, generation: revision.min(1) };
const versioned = { ...bound, id, revision: revision.min(1) };
const receiptHash = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .optional();
const impact = { previewId: id, previewSecretHash: z.string().regex(/^[a-f0-9]{64}$/) };
export const CommandSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("avatar.create"),
    id,
    contentType: z.enum(["image/jpeg", "image/png"]),
    bytes: z.number().int().min(1).max(5242880),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    bucket: z.string().min(3).max(63),
  }),
  z.strictObject({ type: z.literal("avatar.replace"), id }),
  z.strictObject({ type: z.literal("avatar.delete"), id, revision: revision.min(1) }),
  z.strictObject({
    type: z.literal("profile.update"),
    displayName: DisplayNameSchema,
    bio: BioSchema.nullable(),
    revision: revision.min(1),
  }),
  z.strictObject({
    type: z.literal("source.register"),
    id,
    kind: z.enum(["photo", "audio", "video", "note", "location", "track"]),
    provenance: z.enum(["native_capture", "selected_import"]),
  }),
  z.strictObject({
    type: z.literal("source_asset.register"),
    id,
    sourceId: id,
    kind: z.enum(["image", "audio", "video", "text", "track"]),
  }),
  z.strictObject({
    type: z.literal("source_scope.change"),
    ...bound,
    id,
    sourceId: id,
    revision,
    scope: z.enum(["only_me", "journey_review", "publication_reuse"]),
    statusReceiptHash: receiptHash,
  }),
  z.strictObject({
    type: z.literal("source_grant.withdraw"),
    ...bound,
    id,
    sourceId: id,
    revision,
    statusReceiptHash: receiptHash,
  }),
  z.strictObject({
    type: z.literal("export.request"),
    ...bound,
    id,
    ownerId: id,
    assetIds: z
      .array(id)
      .min(1)
      .max(100)
      .transform((ids) => [...new Set(ids)].sort()),
  }),
  z.strictObject({
    type: z.literal("export.approve"),
    ...bound,
    id,
    requestId: id,
    revision: revision.min(1),
    hours: z.number().int().min(1).max(168).default(24),
  }),
  z.strictObject({
    type: z.literal("export.revoke"),
    ...versioned,
    statusReceiptHash: receiptHash,
  }),
  z.strictObject({
    type: z.literal("account.delete"),
    revision: revision.min(1),
    generation: revision.min(1),
    confirmDelete: z.literal("delete"),
    statusReceiptHash: z.string().regex(/^[a-f0-9]{64}$/),
    ...impact,
  }),
  z.strictObject({
    type: z.literal("journey.archive"),
    ...bound,
    ...impact,
    revision: revision.min(1),
  }),
  z.strictObject({
    type: z.literal("journey.delete"),
    ...bound,
    ...impact,
    revision: revision.min(1),
    confirmTitle: z.string().min(1).max(160),
    confirmDelete: z.literal("delete"),
  }),
  ...(["membership.leave", "membership.remove"] as const).map((type) =>
    z.strictObject({ type: z.literal(type), ...versioned, ...impact }),
  ),
  ...(["invitation.revoke", "transfer.cancel"] as const).map((type) =>
    z.strictObject({ type: z.literal(type), ...versioned }),
  ),
]);
const ResultSchema = z.object({
  resourceId: id,
  resourceKind: z.string(),
  revision: revision.min(1),
  state: z.enum(["accepted", "restriction_pending", "restriction_complete"]),
  replayed: z.boolean(),
  jobs: z
    .array(
      z.strictObject({ type: z.enum(["restriction", "avatar", "cleanup", "email"]), eventId: id }),
    )
    .max(100),
});
/** Trusted session integration supplies freshness; never copy it from command JSON. */
export async function executeCommand(
  pool: Pool,
  actor: AccountActor,
  commandId: string,
  input: unknown,
  producer: Awaited<ReturnType<typeof startJobProducer>>,
  session: { fresh: boolean },
) {
  const parsed = CommandSchema.parse(input);
  const { type, ...payload } = parsed;
  return runAsAccount(pool, actor, async (tx) => {
    await tx.execute(
      sql`SELECT pg_catalog.set_config('kairn.session_fresh',${String(session.fresh)},true)`,
    );
    const rows = await tx.execute(
      sql`SELECT operations.execute_command(${id.parse(commandId)}::uuid,${type},${JSON.stringify(payload)}::jsonb) AS result`,
    );
    const result = ResultSchema.parse(rows.rows[0]?.result);
    for (const job of result.jobs) await producer[job.type](tx, job.eventId);
    return result;
  }).catch((error: unknown) => {
    const diagnostic = z
      .string()
      .regex(/^[a-z0-9_]{1,128}$/)
      .optional();
    const databaseError = z
      .object({
        cause: z.object({
          code: z.string().regex(/^[A-Z0-9]{5}$/),
          column: diagnostic,
          table: diagnostic,
          constraint: diagnostic,
        }),
      })
      .safeParse(error);
    // Drizzle errors contain SQL parameters. Only a finite code crosses this boundary.
    throw new Error("Domain command could not be completed.", {
      cause: databaseError.success ? databaseError.data.cause : { code: "unavailable" },
    });
  });
}
export function newStatusReceipt() {
  const secret = randomBytes(32).toString("base64url");
  return { secret, hash: hashStatusReceipt(secret) };
}
export async function previewImpact(
  pool: Pool,
  actor: AccountActor,
  input: {
    action: "delete_account" | "archive" | "delete_journey" | "leave" | "remove_member";
    journeyId: string | null;
    targetId: string;
  },
) {
  const secret = newStatusReceipt();
  const previewId = randomUUID();
  const result = await runAsAccount(pool, actor, (tx) =>
    tx.execute(
      sql`SELECT operations.preview_impact(${previewId}::uuid,${input.action},${input.journeyId}::uuid,${id.parse(input.targetId)}::uuid,${secret.hash}) AS preview`,
    ),
  );
  const preview = z
    .object({ revision: revision.min(1), generation: revision.min(1), digest: z.string() })
    .parse(result.rows[0]?.preview);
  return { ...preview, previewId, previewSecret: secret.secret, previewSecretHash: secret.hash };
}
export function hashStatusReceipt(secret: string) {
  z.string()
    .regex(/^[A-Za-z0-9_-]{43}$/)
    .parse(secret);
  return createHash("sha256").update(secret).digest("hex");
}
/** HMAC key is server-owned and distinct from mail/journal keys. Raw targets are never stored. */
export function abuseKey(key: Buffer, operation: string, target: string) {
  if (key.length !== 32) throw new Error("Invalid abuse key.");
  return createHmac("sha256", key)
    .update(JSON.stringify([operation, target]))
    .digest("hex");
}
export async function consumeBudget(
  pool: Pool,
  operation: string,
  keyHash: string,
  scope: "account" | "ip" | "target" | "cooldown" | "journey" = "account",
) {
  const result = await pool.query("SELECT operations.consume_budget($1,$2,$3) AS allowed", [
    operation,
    keyHash,
    scope,
  ]);
  return z.boolean().parse(result.rows[0]?.allowed);
}
export async function restrictionStatus(pool: Pool, operationId: string, secret: string) {
  const result = await pool.query("SELECT operations.restriction_status($1,$2) AS status", [
    id.parse(operationId),
    hashStatusReceipt(secret),
  ]);
  return result.rows[0]?.status ?? null;
}
