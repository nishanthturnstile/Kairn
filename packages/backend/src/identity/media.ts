import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { Pool } from "pg";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { runAsAccount, type AccountActor } from "./context.js";
import { sha256 } from "../operations/journal.js";

const maxBytes = 5242880;
/** HTTP adapters read through this bound before materializing the upload buffer. */
export async function readAvatarUpload(request: Request) {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  const length = request.headers.get("content-length");
  if (
    !["image/jpeg", "image/png"].includes(type ?? "") ||
    (length !== null &&
      (!/^[0-9]+$/.test(length) || Number(length) < 1 || Number(length) > maxBytes)) ||
    !request.body
  )
    throw new Error("Unsupported identity upload.");
  const reader = request.body.getReader();
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15000)]);
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener("abort", abort, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      if (signal.aborted) throw new Error("Identity upload timed out.");
      const { done, value } = await reader.read();
      if (signal.aborted) throw new Error("Identity upload timed out.");
      if (done) break;
      size += value.length;
      if (size > maxBytes) throw new Error("Identity upload exceeds the byte limit.");
      chunks.push(value);
    }
    if (!size || (length !== null && size !== Number(length)))
      throw new Error("Incomplete identity upload.");
    return Buffer.concat(chunks);
  } finally {
    signal.removeEventListener("abort", abort);
    await reader.cancel();
  }
}
const AvatarSchema = z.object({
  id: z.uuid(),
  owner_account_id: z.uuid(),
  state: z.string(),
  revision: z.coerce.number().int().positive(),
  quarantine_bucket: z.string(),
  quarantine_key: z.string(),
  input_bytes: z.number(),
  input_sha256: z.string(),
  input_content_type: z.enum(["image/png", "image/jpeg"]),
  representation_bucket: z.string().nullable(),
  representation_key: z.string().nullable(),
  representation_sha256: z.string().nullable(),
  representation_bytes: z.coerce.number().nullable(),
});
export class PrivateIdentityStorage {
  constructor(
    private client: S3Client,
    readonly bucket: string,
  ) {
    if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))
      throw new Error("Invalid private identity bucket.");
  }
  private location(bucket: string, key: string) {
    if (
      bucket !== this.bucket ||
      !/^(quarantine|avatars)\/[a-f0-9-]{36}\/[a-f0-9-]{36}(\.jpg)?$/.test(key)
    )
      throw new Error("Invalid identity storage location.");
    return { Bucket: bucket, Key: key };
  }
  async put(bucket: string, key: string, bytes: Buffer, type: string) {
    if (bytes.length < 1 || bytes.length > maxBytes)
      throw new Error("Identity image size unavailable.");
    try {
      await this.client.send(
        new PutObjectCommand({
          ...this.location(bucket, key),
          Body: bytes,
          ContentType: type,
          IfNoneMatch: "*",
          CacheControl: "private, no-store",
        }),
        { abortSignal: AbortSignal.timeout(10000) },
      );
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !["PreconditionFailed", "ConditionalRequestConflict"].includes(error.name)
      )
        throw new Error("Private identity storage unavailable.");
      if (sha256(await this.get(bucket, key, maxBytes)) !== sha256(bytes))
        throw new Error("Immutable identity object conflict.");
    }
  }
  async get(bucket: string, key: string, limit: number) {
    const response = await this.client.send(new GetObjectCommand(this.location(bucket, key)), {
      abortSignal: AbortSignal.timeout(10000),
    });
    if (!response.Body || !response.ContentLength || response.ContentLength > limit) {
      await response.Body?.transformToWebStream().cancel();
      throw new Error("Invalid identity object size.");
    }
    const reader = response.Body.transformToWebStream().getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > limit) throw new Error("Identity object exceeds bound.");
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    if (size !== response.ContentLength) throw new Error("Incomplete identity object.");
    return Buffer.concat(chunks);
  }
  async delete(bucket: string, key: string) {
    await this.client.send(new DeleteObjectCommand(this.location(bucket, key)), {
      abortSignal: AbortSignal.timeout(10000),
    });
  }
}
/** Decode in a killable child, one at a time per worker handler. Native codec allocations
 * live inside the bounded worker container; no SVG/PDF/GIF/HEIC is accepted.
 */
async function decodeAvatar(input: Buffer) {
  if (!input.length || input.length > maxBytes) throw new Error("Invalid image size.");
  return new Promise<{
    bytes: Buffer;
    width: number;
    height: number;
    inputWidth: number;
    inputHeight: number;
  }>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--max-old-space-size=96", fileURLToPath(new URL("./avatar-codec.js", import.meta.url))],
      { stdio: ["pipe", "pipe", "ignore"], env: { PATH: process.env.PATH } },
    );
    const chunks: Buffer[] = [];
    let size = 0;
    const timer = setTimeout(() => child.kill("SIGKILL"), 8000);
    child.stdout.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 8 * 1024 * 1024) child.kill("SIGKILL");
      else chunks.push(chunk);
    });
    child.on("error", () => {
      clearTimeout(timer);
      reject(new Error("Image processing unavailable."));
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        if (code !== 0 || size > 8 * 1024 * 1024) throw new Error();
        const result = z
          .object({
            bytes: z.string(),
            width: z.number().int().min(1).max(512),
            height: z.number().int().min(1).max(512),
            inputWidth: z.number().int().positive(),
            inputHeight: z.number().int().positive(),
          })
          .parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        resolve({ ...result, bytes: Buffer.from(result.bytes, "base64") });
      } catch {
        reject(new Error("Invalid or unsupported image."));
      }
    });
  });
}
let decoderTail = Promise.resolve();
export async function sanitizeAvatar(input: Buffer) {
  const previous = decoderTail;
  let release = () => {};
  decoderTail = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await decodeAvatar(input);
  } finally {
    release();
  }
}
export async function uploadAvatar(
  pool: Pool,
  actor: AccountActor,
  avatarId: string,
  bytes: Buffer,
  storage: PrivateIdentityStorage,
) {
  return runAsAccount(pool, actor, async (tx) => {
    const rows = await tx.execute(
      sql`SELECT operations.avatar_target(${z.uuid().parse(avatarId)}::uuid,'upload') AS avatar`,
    );
    const avatar = AvatarSchema.parse(rows.rows[0]?.avatar);
    const detected = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "image/png"
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? "image/jpeg"
        : null;
    if (
      bytes.length !== avatar.input_bytes ||
      sha256(bytes) !== avatar.input_sha256 ||
      detected !== avatar.input_content_type
    )
      throw new Error("Identity upload does not match declaration.");
    await storage.put(
      avatar.quarantine_bucket,
      avatar.quarantine_key,
      bytes,
      avatar.input_content_type,
    );
    await tx.execute(sql`SELECT operations.record_avatar_upload(${avatar.id}::uuid)`);
  });
}
export async function processAvatar(pool: Pool, avatarId: string, storage: PrivateIdentityStorage) {
  // PostgreSQL returns canonical UUIDs; keep object keys canonical for callers
  // that supplied an otherwise valid uppercase UUID (including restored jobs).
  const id = z.uuid().parse(avatarId).toLowerCase();
  const rows = await pool.query("SELECT operations.avatar_target($1,'process') AS avatar", [id]);
  if (!rows.rows[0]?.avatar) return;
  const avatar = AvatarSchema.parse(rows.rows[0].avatar);
  if (avatar.state === "available") {
    await storage.delete(avatar.quarantine_bucket, avatar.quarantine_key);
    await pool.query("SELECT operations.mark_avatar_quarantine_purged($1)", [id]);
    return;
  }
  const input = await storage.get(avatar.quarantine_bucket, avatar.quarantine_key, maxBytes);
  if (input.length !== avatar.input_bytes || sha256(input) !== avatar.input_sha256) {
    await pool.query("SELECT operations.fail_avatar($1,'invalid_image')", [id]);
    return;
  }
  let clean: Awaited<ReturnType<typeof sanitizeAvatar>>;
  try {
    clean = await sanitizeAvatar(input);
  } catch {
    await pool.query("SELECT operations.fail_avatar($1,'invalid_image')", [id]);
    return;
  }
  const key = `avatars/${avatar.owner_account_id}/${id}.jpg`;
  await storage.put(storage.bucket, key, clean.bytes, "image/jpeg");
  const result = await pool.query(
    "SELECT operations.complete_avatar($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS committed",
    [
      id,
      avatar.revision,
      storage.bucket,
      key,
      sha256(clean.bytes),
      clean.bytes.length,
      clean.width,
      clean.height,
      clean.inputWidth,
      clean.inputHeight,
    ],
  );
  if (result.rows[0]?.committed !== true) await storage.delete(storage.bucket, key);
  else {
    await storage.delete(avatar.quarantine_bucket, avatar.quarantine_key);
    await pool.query("SELECT operations.mark_avatar_quarantine_purged($1)", [id]);
  }
}
export async function readAvatar(pool: Pool, actor: AccountActor, storage: PrivateIdentityStorage) {
  return runAsAccount(pool, actor, async (tx) => {
    // Account lock serializes the read with account denial, then avatar rows serialize removal.
    const rows = await tx.execute(sql`SELECT operations.read_avatar() AS avatar`);
    if (!rows.rows[0]?.avatar) return null;
    const avatar = AvatarSchema.parse(rows.rows[0].avatar);
    if (!avatar.representation_bucket || !avatar.representation_key || !avatar.representation_bytes)
      return null;
    const bytes = await storage.get(
      avatar.representation_bucket,
      avatar.representation_key,
      avatar.representation_bytes,
    );
    if (sha256(bytes) !== avatar.representation_sha256)
      throw new Error("Avatar integrity unavailable.");
    return {
      bytes,
      contentType: "image/jpeg" as const,
      cacheControl: "private, no-store" as const,
    };
  });
}
