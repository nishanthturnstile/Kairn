import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  AccountDataExportSchema,
  AvatarStatusSchema,
  AvatarUploadSchema,
  AvatarUploadResultSchema,
  CommandSchema,
  MutationResultSchema,
  RestrictionPendingSchema,
  RestrictionCompleteSchema,
  OperationStatusSchema,
  UpdateProfileSchema,
} from "@kairn/contracts";
import { executeCommand, consumeBudget, abuseKey } from "@kairn/backend/commands";
import { runAsAccount } from "@kairn/backend/identity";
import type { createDatabasePool } from "@kairn/backend/database";
import type { startJobProducer } from "@kairn/backend/job-producer";
import {
  readAvatar,
  readAvatarUpload,
  uploadAvatar,
  type PrivateIdentityStorage,
} from "@kairn/backend/media";
import type { createAccountAuth } from "./auth.js";

class AccountProblem extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
const tag = (kind: string, id: string, revision: number) => `"${kind}-${id}-${revision}"`;
function expectedRevision(value: string | null, kind: string, id: string) {
  const prefix = `"${kind}-${id}-`;
  if (!value?.startsWith(prefix) || !/^\d+"$/.test(value.slice(prefix.length)))
    throw new AccountProblem(412, "stale_revision", "Refresh this account before saving.");
  return z.coerce
    .number()
    .int()
    .positive()
    .max(Number.MAX_SAFE_INTEGER)
    .parse(value.slice(prefix.length, -1));
}
async function json(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json")
    throw new AccountProblem(400, "invalid_request", "Use a JSON request.");
  const reader = request.body?.getReader();
  if (!reader) throw new AccountProblem(400, "invalid_request", "Enter account details.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 65536)
        throw new AccountProblem(413, "invalid_request", "The request is too large.");
      chunks.push(value);
    }
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)),
    ) as unknown;
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

/** HTTP projection over existing checked commands and private identity storage.
 * Caller supplies the canonical origin and already-qualified identity transport.
 */
export function createAccountServices(options: {
  auth: ReturnType<typeof createAccountAuth>;
  pool: ReturnType<typeof createDatabasePool>;
  producer: Awaited<ReturnType<typeof startJobProducer>>;
  storage: PrivateIdentityStorage;
  origin: string;
  abuseKey: Buffer;
}) {
  async function handle(request: Request): Promise<Response> {
    const respond = (body: unknown, status = 200, etag?: string) =>
      Response.json(body, {
        status,
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          ...(etag ? { ETag: etag } : {}),
        },
      });
    try {
      const path = new URL(request.url).pathname;
      const operationPath = /^\/api\/v1\/operations\/([0-9a-fA-F-]{36})$/.exec(path);
      const upload = /^\/api\/v1\/me\/avatar\/uploads\/([0-9a-fA-F-]{36})\/(bytes|complete)$/.exec(
        path,
      );
      if (
        !(operationPath && request.method === "GET") &&
        !(path === "/api/v1/me/profile" && request.method === "PATCH") &&
        !(path === "/api/v1/me/export" && request.method === "GET") &&
        !(path === "/api/v1/me/avatar/status" && request.method === "GET") &&
        !(path === "/api/v1/me/avatar/uploads" && request.method === "POST") &&
        !(path === "/api/v1/me/avatar" && ["GET", "DELETE"].includes(request.method)) &&
        !(upload && request.method === (upload[2] === "bytes" ? "PUT" : "POST"))
      )
        throw new AccountProblem(404, "unavailable", "This account action is unavailable.");
      if (request.method !== "GET" && request.headers.get("origin") !== options.origin)
        throw new AccountProblem(403, "forbidden", "Origin is not permitted.");
      const resolved = await options.auth.resolve(request.headers);
      if (!resolved) throw new AccountProblem(401, "session_required", "Sign in to continue.");
      const { actor, fresh } = resolved;
      const command = (id: string, input: unknown) =>
        executeCommand(options.pool, actor, id, input, options.producer, { fresh });
      const operation = async (id: string) => {
        const result = await runAsAccount(options.pool, actor, (tx) =>
          tx.execute(
            `SELECT state,recovery_state,error_code,updated_at FROM operations.lifecycle_operation WHERE id='${z.uuid().parse(id)}'::uuid AND action='avatar.delete'`,
          ),
        );
        const row = result.rows[0];
        if (!row) throw new AccountProblem(404, "unavailable", "This operation is unavailable.");
        const base = {
          access: "denied",
          operationId: id,
          statusLocation: `/api/v1/operations/${id}`,
        };
        const restriction =
          row.recovery_state === "confirmed"
            ? RestrictionCompleteSchema.parse({
                ...base,
                status: "restriction_complete",
                recoveryConfirmation: "confirmed",
              })
            : RestrictionPendingSchema.parse({
                ...base,
                status: "restricted_pending_confirmation",
                recoveryConfirmation: "pending",
                retryAfterSeconds: 5,
              });
        return OperationStatusSchema.parse({
          restriction,
          cleanup:
            row.state === "complete"
              ? "complete"
              : row.error_code
                ? "delayed"
                : row.state === "processing"
                  ? "running"
                  : "pending",
          updatedAt: z.coerce.date().parse(row.updated_at).toISOString(),
        });
      };
      if (operationPath) {
        const id = z.uuid().parse(operationPath[1]);
        if (
          !(await consumeBudget(
            options.pool,
            "status_poll",
            abuseKey(options.abuseKey, "status_poll", `${actor.accountId}:${id}`),
          ))
        )
          throw new AccountProblem(429, "rate_limited", "Try checking the operation again later.");
        return respond(await operation(id));
      }
      const avatarStatus = (selectedId?: string) =>
        runAsAccount(options.pool, actor, async (tx) => {
          const result = await tx.execute(
            `SELECT id,state,revision,failure_code,representation_content_type,width,height FROM identity.profile_avatar WHERE ${selectedId ? `id='${z.uuid().parse(selectedId)}'::uuid AND` : ""} state IN ('available','pending','quarantined','processing','failed') AND (state NOT IN ('pending','quarantined','processing') OR upload_expires_at>now()) ORDER BY CASE WHEN state='available' THEN 0 WHEN state='failed' THEN 2 ELSE 1 END,created_at DESC,id DESC LIMIT 1`,
          );
          const row = result.rows[0];
          if (!row) return AvatarStatusSchema.parse({ state: "absent" });
          if (row.state === "available")
            return AvatarStatusSchema.parse({
              state: "available",
              avatarId: row.id,
              revision: Number(row.revision),
              etag: tag("avatar", String(row.id), Number(row.revision)),
              contentType: row.representation_content_type,
              width: row.width,
              height: row.height,
              managedPath: "/api/v1/me/avatar",
            });
          if (row.state === "failed")
            return AvatarStatusSchema.parse({
              state: "failed",
              uploadId: row.id,
              reason: row.failure_code,
            });
          return AvatarStatusSchema.parse({ state: "processing", uploadId: row.id });
        });
      if (path === "/api/v1/me/avatar/status") {
        if (
          !(await consumeBudget(
            options.pool,
            "status_poll",
            abuseKey(options.abuseKey, "status_poll", `${actor.accountId}:avatar`),
          ))
        )
          throw new AccountProblem(429, "rate_limited", "Try checking the avatar again later.");
        return respond(await avatarStatus());
      }
      if (path === "/api/v1/me/profile") {
        const input = UpdateProfileSchema.parse(await json(request));
        const revision = expectedRevision(
          request.headers.get("if-match"),
          "profile",
          actor.accountId,
        );
        await command(input.commandId, {
          type: "profile.update",
          displayName: input.displayName,
          bio: input.bio,
          revision,
        });
        const account = await options.auth.getMyAccount(request.headers);
        if (!account) throw new AccountProblem(401, "session_required", "Sign in to continue.");
        return respond(account.profile, 200, account.profile.etag);
      }
      if (path === "/api/v1/me/export") {
        if (
          !(await consumeBudget(
            options.pool,
            "export",
            abuseKey(options.abuseKey, "export", actor.accountId),
          ))
        )
          throw new AccountProblem(429, "rate_limited", "Try exporting again later.");
        const account = await options.auth.getMyAccount(request.headers);
        if (!account) throw new AccountProblem(401, "session_required", "Sign in to continue.");
        return respond(
          AccountDataExportSchema.parse({
            exportedAt: new Date().toISOString(),
            account,
            avatar: await avatarStatus(),
          }),
        );
      }
      if (path === "/api/v1/me/avatar/uploads") {
        const input = AvatarUploadSchema.parse(await json(request));
        await command(input.commandId, {
          type: "avatar.create",
          id: input.uploadId,
          contentType: input.contentType,
          bytes: input.byteLength,
          sha256: input.sha256,
          bucket: options.storage.bucket,
        });
        const allocation = await runAsAccount(options.pool, actor, async (tx) => {
          // UUID is validated by the strict input schema before interpolation.
          const rows = await tx.execute(
            `SELECT upload_expires_at,revision FROM identity.profile_avatar WHERE id='${input.uploadId}'::uuid`,
          );
          return {
            expiresAt: z.coerce.date().parse(rows.rows[0]?.upload_expires_at).toISOString(),
            etag: tag("avatar", input.uploadId, Number(rows.rows[0]?.revision)),
          };
        });
        return respond(
          AvatarUploadResultSchema.parse({
            uploadId: input.uploadId,
            uploadPath: `/api/v1/me/avatar/uploads/${input.uploadId}/bytes`,
            expiresAt: allocation.expiresAt,
          }),
          201,
          allocation.etag,
        );
      }
      if (upload) {
        const id = z.uuid().parse(upload[1]);
        if (upload[2] === "bytes") {
          let bytes: Buffer;
          try {
            bytes = await readAvatarUpload(request);
          } catch {
            throw new AccountProblem(400, "invalid_request", "Choose a JPEG or PNG up to 5 MiB.");
          }
          await uploadAvatar(options.pool, actor, id, bytes, options.storage);
          const result = await runAsAccount(options.pool, actor, (tx) =>
            tx.execute(`SELECT revision FROM identity.profile_avatar WHERE id='${id}'::uuid`),
          );
          // The byte write has an immutable upload identity, not a new command receipt.
          return respond(
            MutationResultSchema.parse({
              status: "accepted",
              commandId: id,
              resourceId: id,
              revision: Number(result.rows[0]?.revision),
              etag: tag("avatar", id, Number(result.rows[0]?.revision)),
            }),
          );
        }
        const input = CommandSchema.parse(await json(request));
        await command(input.commandId, { type: "avatar.replace", id });
        const revision = await runAsAccount(options.pool, actor, (tx) =>
          tx.execute(`SELECT revision FROM identity.profile_avatar WHERE id='${id}'::uuid`),
        );
        return respond(
          await avatarStatus(id),
          200,
          tag("avatar", id, Number(revision.rows[0]?.revision)),
        );
      }
      if (request.method === "GET") {
        const image = await readAvatar(options.pool, actor, options.storage);
        if (!image) throw new AccountProblem(404, "unavailable", "No avatar is available.");
        return new Response(new Uint8Array(image.bytes), {
          headers: {
            "Content-Type": image.contentType,
            "Cache-Control": image.cacheControl,
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
      const input = CommandSchema.parse(await json(request));
      // An ETag names its exact avatar, including after removal for idempotent retry.
      const match = /^"avatar-([0-9a-fA-F-]{36})-(\d+)"$/.exec(
        request.headers.get("if-match") ?? "",
      );
      if (!match)
        throw new AccountProblem(412, "stale_revision", "Refresh the avatar before removing it.");
      const id = z.uuid().parse(match[1]);
      const result = await command(input.commandId, {
        type: "avatar.delete",
        id,
        revision: expectedRevision(request.headers.get("if-match"), "avatar", id),
      });
      const status = await operation(result.resourceId);
      return respond(
        status.restriction,
        status.restriction.recoveryConfirmation === "confirmed" ? 200 : 202,
      );
    } catch (error) {
      const sql = z.object({ cause: z.object({ code: z.string() }) }).safeParse(error);
      const code = sql.success ? sql.data.cause.code : "";
      const problem =
        error instanceof AccountProblem
          ? error
          : error instanceof z.ZodError ||
              error instanceof SyntaxError ||
              error instanceof TypeError
            ? new AccountProblem(400, "invalid_request", "Check the account details and try again.")
            : code === "40001"
              ? new AccountProblem(
                  412,
                  "stale_revision",
                  "This account changed. Refresh before saving.",
                )
              : code === "23505"
                ? new AccountProblem(
                    409,
                    "command_payload_conflict",
                    "This command conflicts with an earlier request.",
                  )
                : code === "42501"
                  ? new AccountProblem(403, "forbidden", "This account action is unavailable.")
                  : new AccountProblem(
                      503,
                      "dependency_unavailable",
                      "Account service is temporarily unavailable.",
                    );
      const response = respond(
        {
          type: "about:blank",
          title: problem.message,
          status: problem.status,
          code: problem.code,
          requestId: randomUUID(),
        },
        problem.status,
      );
      response.headers.set("Content-Type", "application/problem+json");
      if (problem.status === 429) response.headers.set("Retry-After", "3600");
      return response;
    }
  }
  return { handle };
}
