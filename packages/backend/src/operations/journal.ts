import {
  createHash,
  timingSafeEqual,
  randomUUID,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
} from "node:crypto";
import { mkdir, open, readFile, rmdir, rename, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Pool } from "pg";
import { z } from "zod";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const LegacyJournalEventSchema = z.strictObject({
  id: z.uuid(),
  kind: z.enum([
    "invitation.revoke",
    "invitation.supersede",
    "invitation.decline",
    "transfer.cancel",
    "transfer.decline",
    "transfer.invalidate",
    "transfer.accept",
    "journey.archive",
    "journey.freeze",
    "journey.delete",
    "membership.leave",
    "membership.remove",
    "capability.remove",
    "account.delete",
    "source.narrow",
    "source.withdraw",
    "source.delete",
    "export.revoke",
    "export.invalidate",
    "avatar.delete",
  ]),
  resourceKind: z.enum([
    "account",
    "journey",
    "membership",
    "invitation",
    "transfer",
    "source",
    "source_grant",
    "export_grant",
    "avatar",
  ]),
  resourceId: z.uuid(),
  accountId: z.uuid().nullable(),
  journeyId: z.uuid().nullable(),
  membershipId: z.uuid().nullable(),
  sourceId: z.uuid().nullable(),
  sourceGrantId: z.uuid().nullable(),
  exportGrantId: z.uuid().nullable(),
  invitationId: z.uuid().nullable(),
  transferId: z.uuid().nullable(),
  generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
// Keep legacy signed bodies byte-for-byte. New account denies retain only the
// opaque authentication subject needed when a backup predates domain provisioning.
export const JournalEventSchema = z.union([
  LegacyJournalEventSchema,
  LegacyJournalEventSchema.extend({
    version: z.literal(2),
    kind: z.literal("account.delete"),
    resourceKind: z.literal("account"),
    authSubjectId: z.string().min(1).max(512),
  }),
]);
const EntrySchema = z.strictObject({
  sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  body: z.string().max(4096),
  eventSha256: digest,
  previousSha256: digest,
  checkpointSha256: digest,
  keyId: z.string().min(1).max(64),
  receipt: z.string().min(1).max(512),
});
export type JournalEntry = z.infer<typeof EntrySchema>;
export interface RestrictionJournal {
  append(body: string, sha256: string): Promise<JournalEntry>;
  read(): Promise<JournalEntry[]>;
}
export function signJournalHead(
  entries: JournalEntry[],
  nonce: string,
  keyId: string,
  key: Buffer,
) {
  const unsigned = {
    nonce,
    sequence: entries.length,
    checkpointSha256: entries.at(-1)?.checkpointSha256 ?? "0".repeat(64),
    keyId,
  };
  return {
    ...unsigned,
    signature: signMessage(key, JSON.stringify(unsigned)),
  };
}
const zero = "0".repeat(64);
export const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
function privateKey(seed: Buffer) {
  if (seed.length !== 32) throw new Error("Invalid journal signing seed.");
  return createPrivateKey({
    key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]),
    format: "der",
    type: "pkcs8",
  });
}
export function journalPublicKeys(signingSeeds: ReadonlyMap<string, Buffer>) {
  return new Map(
    [...signingSeeds].map(([id, seed]) => [
      id,
      createPublicKey(privateKey(seed)).export({ format: "der", type: "spki" }).subarray(-32),
    ]),
  );
}
function signMessage(seed: Buffer, message: string) {
  return sign(null, Buffer.from(message), privateKey(seed)).toString("hex");
}
function verifyMessage(key: Buffer, message: string, signature: string) {
  if (key.length !== 32 || !/^[a-f0-9]{128}$/.test(signature)) return false;
  return verify(
    null,
    Buffer.from(message),
    createPublicKey({
      key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), key]),
      format: "der",
      type: "spki",
    }),
    Buffer.from(signature, "hex"),
  );
}
function entrySignature(key: Buffer, entry: Omit<JournalEntry, "receipt">) {
  return signMessage(key, JSON.stringify(entry));
}
function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function verifyJournal(entries: unknown, keys: ReadonlyMap<string, Buffer>) {
  const parsed = z.array(EntrySchema).parse(entries);
  const ids = new Set<string>();
  let previous = zero;
  for (const [i, entry] of parsed.entries()) {
    const event = JournalEventSchema.parse(JSON.parse(entry.body));
    const key = keys.get(entry.keyId);
    const { receipt, ...unsigned } = entry;
    if (
      !key ||
      key.length !== 32 ||
      ids.has(event.id) ||
      entry.sequence !== i + 1 ||
      entry.previousSha256 !== previous ||
      entry.eventSha256 !== sha256(entry.body) ||
      entry.checkpointSha256 !== sha256(JSON.stringify([i + 1, previous, entry.eventSha256])) ||
      !verifyMessage(key, JSON.stringify(unsigned), receipt)
    )
      throw new Error("Journal integrity unavailable.");
    ids.add(event.id);
    previous = entry.checkpointSha256;
  }
  return parsed;
}
/** Independent-host service storage. Never place this directory on the application VPS/backup.
 * Local use is a deterministic failure fixture, not independent failure-domain qualification.
 * A crash leaving a lock or partial tail requires operator reconciliation, never silent truncation.
 */
export class FileRestrictionJournal implements RestrictionJournal {
  constructor(
    private directory: string,
    private keyId: string,
    private keys: ReadonlyMap<string, Buffer>,
  ) {}
  private async hasRecoveryArtifacts() {
    for (const name of ["journal-head.json", "appender.json"]) {
      try {
        await stat(join(this.directory, name));
        return true;
      } catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      }
    }
    return false;
  }
  private async durableJson(name: string, value: unknown) {
    const temporary = join(this.directory, `${name}.${randomUUID()}.tmp`);
    const file = await open(temporary, "wx", 0o600);
    try {
      await file.writeFile(JSON.stringify(value));
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, join(this.directory, name));
    const directory = await open(this.directory, "r");
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  }
  async initializeAppender(token: string) {
    if (token.length < 32) throw new Error("Invalid appender credential.");
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const lock = join(this.directory, "append.lock");
    await mkdir(lock, { mode: 0o700 });
    try {
      const files = await import("node:fs/promises").then((fs) => fs.readdir(this.directory));
      if (files.some((name) => name !== "append.lock"))
        throw new Error("Journal initialization requires a new empty directory.");
      const file = await open(join(this.directory, "restrictions.ndjson"), "wx", 0o600);
      try {
        await file.sync();
      } finally {
        await file.close();
      }
      await this.durableJson("journal-head.json", { sequence: 0, checkpointSha256: zero });
      await this.durableJson("appender.json", {
        tokenHash: sha256(token),
        fenced: false,
        retiredHashes: [],
      });
    } finally {
      await rmdir(lock);
    }
  }
  async fenceAppender() {
    await this.changeAppender();
  }
  async resumeAppender(token: string) {
    if (token.length < 32) throw new Error("Invalid appender credential.");
    await this.changeAppender(token);
  }
  private async changeAppender(token?: string) {
    const lock = join(this.directory, "append.lock");
    await mkdir(lock, { mode: 0o700 });
    try {
      const current = z
        .object({
          tokenHash: digest,
          fenced: z.boolean(),
          retiredHashes: z.array(digest).max(1024),
        })
        .parse(JSON.parse(await readFile(join(this.directory, "appender.json"), "utf8")));
      if (
        token &&
        (!current.fenced ||
          current.tokenHash === sha256(token) ||
          current.retiredHashes.includes(sha256(token)) ||
          current.retiredHashes.length >= 1024)
      )
        throw new Error("A distinct appender credential and fence are required.");
      await this.read();
      await this.durableJson("appender.json", {
        tokenHash: token ? sha256(token) : current.tokenHash,
        fenced: !token,
        retiredHashes: token
          ? [...current.retiredHashes, current.tokenHash]
          : current.retiredHashes,
      });
    } finally {
      await rmdir(lock);
    }
  }
  async read() {
    let bytes: string;
    try {
      if ((await stat(join(this.directory, "restrictions.ndjson"))).size > 12 * 1024 * 1024)
        throw new Error("Journal capacity requires operator review.");
      bytes = await readFile(join(this.directory, "restrictions.ndjson"), "utf8");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        if (!(await this.hasRecoveryArtifacts())) return [];
        throw new Error("Journal tail is missing.");
      }
      throw error;
    }
    if (bytes && !bytes.endsWith("\n")) throw new Error("Journal tail is incomplete.");
    const entries = verifyJournal(
      bytes.trim()
        ? bytes
            .trimEnd()
            .split("\n")
            .map((line) => JSON.parse(line))
        : [],
      journalPublicKeys(this.keys),
    );
    let anchor: unknown;
    try {
      anchor = JSON.parse(await readFile(join(this.directory, "journal-head.json"), "utf8"));
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    if (anchor) {
      const head = z
        .object({ sequence: z.number().int().nonnegative(), checkpointSha256: digest })
        .parse(anchor);
      if (
        head.sequence > entries.length ||
        (head.sequence ? entries[head.sequence - 1]?.checkpointSha256 : zero) !==
          head.checkpointSha256
      )
        throw new Error("Acknowledged journal tail is incomplete.");
    }
    if (!anchor && (await this.hasRecoveryArtifacts()))
      throw new Error("Acknowledged journal head is missing.");
    return entries;
  }
  async append(body: string, expected: string, credentialHash?: string) {
    const event = JournalEventSchema.parse(JSON.parse(body));
    if (Buffer.byteLength(body) > 4096 || sha256(body) !== digest.parse(expected))
      throw new Error("Invalid restriction event.");
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const lock = join(this.directory, "append.lock");
    await mkdir(lock, { mode: 0o700 });
    try {
      if (credentialHash) {
        const state = z
          .object({
            tokenHash: digest,
            fenced: z.boolean(),
            retiredHashes: z.array(digest).max(1024),
          })
          .parse(JSON.parse(await readFile(join(this.directory, "appender.json"), "utf8")));
        if (state.fenced || !same(state.tokenHash, credentialHash))
          throw new Error("Appender generation is fenced.");
      }
      const entries = await this.read();
      const existing = entries.find(
        (entry) => JournalEventSchema.parse(JSON.parse(entry.body)).id === event.id,
      );
      if (existing) {
        if (existing.body !== body) throw new Error("Restriction identity conflict.");
        await this.durableJson("journal-head.json", {
          sequence: entries.length,
          checkpointSha256: entries.at(-1)?.checkpointSha256 ?? zero,
        });
        return existing;
      }
      const key = this.keys.get(this.keyId);
      if (!key || key.length !== 32) throw new Error("Journal key unavailable.");
      const sequence = entries.length + 1;
      const previousSha256 = entries.at(-1)?.checkpointSha256 ?? zero;
      const unsigned = {
        sequence,
        body,
        eventSha256: expected,
        previousSha256,
        checkpointSha256: sha256(JSON.stringify([sequence, previousSha256, expected])),
        keyId: this.keyId,
      };
      const entry = { ...unsigned, receipt: entrySignature(key, unsigned) };
      const line = `${JSON.stringify(entry)}\n`;
      let size = 0;
      try {
        size = (await stat(join(this.directory, "restrictions.ndjson"))).size;
      } catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      }
      if (size + Buffer.byteLength(line) > 12 * 1024 * 1024)
        throw new Error("Journal capacity requires operator review.");
      const file = await open(join(this.directory, "restrictions.ndjson"), "a", 0o600);
      try {
        await file.writeFile(line);
        await file.sync();
      } finally {
        await file.close();
      }
      await this.durableJson("journal-head.json", {
        sequence,
        checkpointSha256: entry.checkpointSha256,
      });
      const directory = await open(this.directory, "r");
      try {
        await directory.sync();
      } finally {
        await directory.close();
      }
      return entry;
    } finally {
      await rmdir(lock);
    }
  }
}
/** HTTPS append + signed ordered snapshot. A supplied expected head is required during recovery;
 * a valid prefix alone cannot prove the independent current head. Transport never retries mutations.
 */
export class HttpRestrictionJournal implements RestrictionJournal {
  constructor(
    private endpoint: URL,
    private token: string,
    private keys: ReadonlyMap<string, Buffer>,
  ) {
    if (
      endpoint.protocol !== "https:" ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash ||
      token.length < 32
    )
      throw new Error("Invalid independent journal configuration.");
  }
  private async request(method: string, body?: string, nonce?: string, suffix = "") {
    const url = new URL(this.endpoint);
    url.pathname += suffix;
    const response = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
        ...(nonce ? { "x-journal-nonce": nonce } : {}),
      },
      ...(body === undefined ? {} : { body }),
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error("Independent journal unavailable.");
    }
    if (!response.body) throw new Error("Journal response unavailable.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 16 * 1024 * 1024) throw new Error("Journal response exceeds bound.");
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    const bytes = Buffer.concat(chunks);
    return JSON.parse(bytes.toString("utf8"));
  }
  async fence() {
    await this.request("POST", undefined, undefined, "/fence");
  }
  async resume(token: string) {
    await this.request("POST", JSON.stringify({ token }), undefined, "/resume");
  }
  async append(body: string, hash: string) {
    const entry = EntrySchema.parse(
      await this.request("POST", JSON.stringify({ body, sha256: hash })),
    );
    const key = this.keys.get(entry.keyId);
    const { receipt, ...unsigned } = entry;
    if (
      !key ||
      !verifyMessage(key, JSON.stringify(unsigned), receipt) ||
      entry.body !== body ||
      entry.eventSha256 !== hash ||
      hash !== sha256(body) ||
      entry.checkpointSha256 !==
        sha256(JSON.stringify([entry.sequence, entry.previousSha256, hash]))
    )
      throw new Error("Journal receipt integrity unavailable.");
    return entry;
  }
  async read() {
    const nonce = randomUUID();
    const response = z
      .object({
        entries: z.array(EntrySchema),
        head: z.object({
          nonce: z.uuid(),
          sequence: z.number(),
          checkpointSha256: digest,
          keyId: z.string(),
          signature: z.string(),
        }),
      })
      .parse(await this.request("GET", undefined, nonce));
    const entries = verifyJournal(response.entries, this.keys);
    const key = this.keys.get(response.head.keyId);
    const { signature, ...unsignedHead } = response.head;
    if (
      !key ||
      response.head.nonce !== nonce ||
      !verifyMessage(key, JSON.stringify(unsignedHead), signature) ||
      response.head.sequence !== entries.length ||
      response.head.checkpointSha256 !== (entries.at(-1)?.checkpointSha256 ?? zero)
    )
      throw new Error("Independent current head unavailable.");
    return entries;
  }
}
export async function confirmRestriction(pool: Pool, journal: RestrictionJournal, eventId: string) {
  const id = z.uuid().parse(eventId);
  const pending = await pool.query("SELECT operations.pending_restriction($1) AS event", [id]);
  if (!pending.rows[0]?.event) return;
  const event = z.object({ body: z.string(), sha256: digest }).parse(pending.rows[0].event);
  try {
    const receipt = await journal.append(event.body, event.sha256);
    await pool.query("SELECT operations.confirm_restriction($1,$2,$3,$4,$5,$6)", [
      id,
      receipt.receipt,
      receipt.sequence,
      receipt.checkpointSha256,
      receipt.eventSha256,
      receipt.keyId,
    ]);
  } catch {
    await pool.query("SELECT operations.restriction_failed($1,'unknown_outcome')", [id]);
    throw new Error("Restriction confirmation pending.");
  }
}
