import { createHash, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import type { createDatabasePool } from "@kairn/backend/database";
type Pool = ReturnType<typeof createDatabasePool>;
import { z } from "zod";
import { jwtVerify } from "jose";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { hashPassword } from "better-auth/crypto";
import { DisplayNameSchema, MyAccountSchema } from "@kairn/contracts";
import { createDatabase } from "@kairn/backend/database";
import { abuseKey, consumeBudget } from "@kairn/backend/commands";
import { enqueueAuthMail, runAuthMailTransaction, sealMail } from "@kairn/backend/mail";
import type { startJobProducer } from "@kairn/backend/job-producer";
import { authOptions } from "@kairn/backend/auth-options";
import { authAdapterSchema } from "@kairn/backend/auth-adapter";
import { provisionVerifiedAccount, runAsAccount } from "@kairn/backend/identity";
import { acceptsNewPassword } from "@kairn/backend/password-policy";

const mailPaths = new Set([
  "/sign-up/email",
  "/request-password-reset",
  "/send-verification-email",
]);
const postPaths = new Set([
  ...mailPaths,
  "/sign-in/email",
  "/sign-out",
  "/reset-password",
  "/change-password",
  "/revoke-session",
  "/revoke-other-sessions",
]);
const callbackPaths = new Set(["/verify-email", "/reset-password", "/account"]);
const failure = (status: number, code: string, message: string) =>
  Response.json({ code, message }, { status, headers: { "Cache-Control": "no-store" } });

/** Caller owns bounded pools/producers/keys. No environment reads or global auth instance.
 * Not mounted by process startup until its web/native transports are qualified.
 */
export function createAccountAuth(options: {
  authPool: Pool;
  accountPool: Pool;
  producer: Awaited<ReturnType<typeof startJobProducer>>;
  origin: string;
  secret: string;
  abuseKey: Buffer;
  mail: { keyId: string; key: Buffer; recipientKey: Buffer };
}) {
  const origin = new URL(options.origin);
  if (origin.protocol !== "https:" || origin.href !== `${origin.origin}/`)
    throw new Error("Account authentication requires a canonical HTTPS origin.");
  if (
    options.secret.length < 32 ||
    options.abuseKey.length !== 32 ||
    options.mail.key.length !== 32 ||
    options.mail.recipientKey.length !== 32
  )
    throw new Error("Account authentication keys are invalid.");
  const callbackAllowed = (value: unknown) => {
    if (typeof value !== "string") return false;
    try {
      const url = new URL(value, origin);
      return (
        url.origin === origin.origin &&
        callbackPaths.has(url.pathname) &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      );
    } catch {
      return false;
    }
  };
  function instance(
    database: Parameters<typeof drizzleAdapter>[0],
    send: (
      purpose: "verification" | "password_reset",
      data: { user: { id: string; email: string }; url: string; token: string },
    ) => Promise<void>,
  ) {
    return betterAuth({
      ...authOptions,
      secret: options.secret,
      baseURL: origin.origin,
      trustedOrigins: [origin.origin, "kairn-dev://"],
      plugins: [expo({ disableOriginOverride: true })],
      logger: { disabled: true },
      // Better Call otherwise logs unexpected SQL errors (including parameters)
      // even when the auth logger is disabled. Let the outer boundary redact.
      onAPIError: { throw: true },
      database: drizzleAdapter(database, {
        provider: "pg",
        schema: authAdapterSchema(),
        transaction: true,
      }),
      databaseHooks: {
        session: {
          create: {
            before: async (session) => {
              const result = await options.authPool.query(
                'SELECT name,email_verified FROM authn."user" WHERE id=$1',
                [session.userId],
              );
              const user = z
                .object({ name: z.string(), email_verified: z.literal(true) })
                .safeParse(result.rows[0]);
              if (!user.success)
                throw new APIError("FORBIDDEN", {
                  message: "Verify your email before signing in.",
                });
              try {
                await provisionVerifiedAccount(options.authPool, session.userId, user.data.name);
              } catch (error) {
                if (z.object({ code: z.literal("42501") }).safeParse(error).success)
                  throw new APIError("FORBIDDEN", { message: "Account access is unavailable." });
                throw new Error("Account service is unavailable.");
              }
              return { data: session };
            },
          },
        },
      },
      advanced: { useSecureCookies: true, ipAddress: { disableIpTracking: true } },
      // Atomic domain budgets below own the credential paths. Library's broader
      // DB limiter remains enabled as a second ceiling, not our concurrency proof.
      emailVerification: {
        ...authOptions.emailVerification,
        sendVerificationEmail: (data) => send("verification", data),
      },
      emailAndPassword: {
        ...authOptions.emailAndPassword,
        password: {
          hash: async (password) => {
            if (!acceptsNewPassword(password))
              throw new APIError("BAD_REQUEST", {
                message: "Choose a longer, less predictable password.",
              });
            return hashPassword(password);
          },
        },
        sendResetPassword: (data) => send("password_reset", data),
      },
      hooks: {
        before: createAuthMiddleware(async (ctx) => {
          const body = ctx.body;
          if (ctx.path === "/verify-email") {
            try {
              const token = z.string().max(8192).parse(ctx.query?.token);
              const { payload } = await jwtVerify(token, new TextEncoder().encode(options.secret), {
                algorithms: ["HS256"],
              });
              const email = z.email().parse(payload.email);
              if (payload.updateTo || payload.requestType)
                throw new Error("Unsupported verification intent.");
              const bindingId = `kairn-email:${createHash("sha256").update(token).digest("hex")}`;
              const binding = await ctx.context.internalAdapter.findVerificationValue(bindingId);
              const user = await ctx.context.internalAdapter.findUserByEmail(email);
              if (
                !binding ||
                binding.expiresAt <= new Date() ||
                !user ||
                user.user.emailVerified ||
                binding.value !== user.user.id ||
                !(await ctx.context.internalAdapter.consumeVerificationValue(bindingId))
              )
                throw new Error("Unavailable verification.");
            } catch {
              throw new APIError("BAD_REQUEST", {
                message: "This verification link is unavailable. Request a new email.",
              });
            }
          }
          for (const field of ["callbackURL", "redirectTo"]) {
            const value: unknown = body?.[field] ?? ctx.query?.[field];
            if (value !== undefined && !callbackAllowed(value))
              throw new APIError("BAD_REQUEST", { message: "Callback is unavailable." });
          }
          if (ctx.path === "/sign-up/email") {
            const parsed = DisplayNameSchema.safeParse(body?.name);
            if (!parsed.success)
              throw new APIError("BAD_REQUEST", {
                message: "Enter a display name of 1–80 characters.",
              });
            body.name = parsed.data;
          }
          if (["/sign-up/email", "/reset-password", "/change-password"].includes(ctx.path)) {
            const candidate: unknown =
              ctx.path === "/sign-up/email" ? body?.password : body?.newPassword;
            let email: unknown = body?.email;
            let name: unknown = body?.name;
            if (ctx.path === "/change-password") {
              const session = await getSessionFromCtx(ctx);
              email = session?.user.email;
              name = session?.user.name;
            }
            // Reset does not trust an email supplied by the caller. Resolve the
            // library-owned token binding to obtain its identity context.
            const resetToken: unknown = body?.token || ctx.query?.token;
            if (ctx.path === "/reset-password" && typeof resetToken === "string") {
              const verification = await ctx.context.internalAdapter.findVerificationValue(
                `reset-password:${resetToken}`,
              );
              if (verification && verification.expiresAt > new Date()) {
                const user = await ctx.context.internalAdapter.findUserById(verification.value);
                email = user?.email;
                name = user?.name;
              }
            }
            const parts = [
              email,
              typeof email === "string" ? email.split("@")[0] : undefined,
              name,
            ].filter((value): value is string => typeof value === "string");
            if (!acceptsNewPassword(candidate, parts))
              throw new APIError("BAD_REQUEST", {
                message: "Use 15–128 characters and avoid common passwords or personal details.",
              });
          }
        }),
      },
    });
  }
  const current = instance(createDatabase(options.authPool), async () => {
    throw new Error("Auth mail requires its transaction guard.");
  });

  async function handle(request: Request, clientIp: string): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.slice(authOptions.basePath.length);
    if (
      !url.pathname.startsWith(`${authOptions.basePath}/`) ||
      !(request.method === "POST"
        ? postPaths.has(path)
        : request.method === "GET" &&
          (path === "/verify-email" ||
            path === "/list-sessions" ||
            path.startsWith("/reset-password/")))
    )
      return failure(404, "unavailable", "This account action is unavailable.");
    if (
      url.origin !== origin.origin ||
      (request.method === "POST" &&
        ![origin.origin, "kairn-dev://"].includes(request.headers.get("origin") ?? ""))
    )
      return failure(403, "invalid_origin", "Origin is not permitted.");
    if (!isIP(clientIp))
      return failure(503, "unavailable", "Authentication is temporarily unavailable.");
    let body: Record<string, unknown> = {};
    if (request.method === "POST") {
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        return failure(415, "invalid_request", "Use a JSON request.");
      // Read incrementally: neither Content-Length nor request.text() is a bound.
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 65536) {
              await reader.cancel();
              return failure(413, "invalid_request", "The request is too large.");
            }
            chunks.push(value);
          }
        } catch {
          return failure(400, "invalid_request", "The request could not be read.");
        } finally {
          reader.releaseLock();
        }
      }
      try {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
        body = z.record(z.string(), z.unknown()).parse(JSON.parse(text));
      } catch {
        return failure(400, "invalid_request", "Enter valid account details.");
      }
      if (path === "/sign-up/email" && body.image !== undefined)
        return failure(400, "invalid_request", "Use the managed avatar upload after signing in.");
      if (
        ["/sign-up/email", "/send-verification-email"].includes(path) &&
        body.callbackURL === undefined
      )
        body.callbackURL = `${origin.origin}/verify-email`;
      if (path === "/request-password-reset" && body.redirectTo === undefined)
        body.redirectTo = `${origin.origin}/reset-password`;
      // Reconstruct once after consuming the bounded body; no secrets are logged.
      const requestHeaders = new Headers(request.headers);
      requestHeaders.delete("content-length");
      request = new Request(request.url, {
        method: request.method,
        headers: requestHeaders,
        body: JSON.stringify(body),
      });
    }
    try {
      const normalizedEmail =
        typeof body.email === "string" ? body.email.trim().toLowerCase() : "unavailable";
      const budget = async (
        op: string,
        scope: "ip" | "target" | "cooldown" | "account",
        target: string,
      ) =>
        consumeBudget(
          options.authPool,
          op,
          abuseKey(options.abuseKey, `${op}:${scope}`, target),
          scope,
        );
      const budgets: Promise<boolean>[] = [];
      if (path === "/sign-up/email") budgets.push(budget("register", "ip", clientIp));
      const reservations: { key: string; at: Date }[] = [];
      if (path === "/sign-in/email" || path === "/change-password") {
        const identifier =
          path === "/change-password"
            ? ((
                await current.api.getSession({ headers: request.headers })
              )?.user.email.toLowerCase() ?? "unavailable")
            : normalizedEmail;
        for (const [scope, target] of [
          ["ip", clientIp],
          ["account", `${identifier}:${clientIp}`],
        ] as const) {
          const key = abuseKey(options.abuseKey, `sign_in:${scope}`, target);
          const reserved = await options.authPool.query(
            "SELECT operations.reserve_auth_attempt($1,$2) AS at",
            [key, scope],
          );
          if (!reserved.rows[0]?.at) {
            const limited = failure(429, "rate_limited", "Too many attempts. Try again later.");
            limited.headers.set("Retry-After", "900");
            return limited;
          }
          reservations.push({ key, at: z.coerce.date().parse(reserved.rows[0].at) });
        }
      }
      if (mailPaths.has(path))
        budgets.push(
          budget("auth_mail", "ip", clientIp),
          budget("auth_mail", "target", normalizedEmail),
          budget("auth_mail", "cooldown", normalizedEmail),
        );
      if ((await Promise.all(budgets)).some((allowed) => !allowed)) {
        const response = failure(429, "rate_limited", "Too many attempts. Try again later.");
        response.headers.set("Retry-After", "60");
        return response;
      }
      if (["/list-sessions", "/revoke-session", "/revoke-other-sessions"].includes(path)) {
        const resolved = await resolve(request.headers);
        if (!resolved) return failure(401, "session_required", "Sign in to continue.");
        if (!resolved.fresh)
          return failure(
            403,
            "reauthentication_required",
            "Sign in again before managing sessions.",
          );
        if (path === "/list-sessions") {
          const sessions = await current.api.listSessions({ headers: request.headers });
          return Response.json(
            sessions.map((session) => ({
              id: session.id,
              current: session.id === resolved.session.session.id,
              createdAt: session.createdAt.toISOString(),
              expiresAt: session.expiresAt.toISOString(),
              // User agent is untrusted descriptive text; clients must render as text.
              description: session.userAgent?.slice(0, 256) || "Kairn session",
            })),
            { headers: { "Cache-Control": "no-store" } },
          );
        }
        if (path === "/revoke-session") {
          const input = z.strictObject({ sessionId: z.string().min(1).max(256) }).safeParse(body);
          if (!input.success) return failure(400, "invalid_request", "Select a session to revoke.");
          const sessions = await current.api.listSessions({ headers: request.headers });
          const selected = sessions.find((session) => session.id === input.data.sessionId);
          if (!selected) return failure(404, "unavailable", "This session is unavailable.");
          // Translate an own-session reference inside the server; tokens never cross JSON.
          request = new Request(request.url, {
            method: "POST",
            headers: request.headers,
            body: JSON.stringify({ token: selected.token }),
          });
        }
      }
      let response: Response;
      if (mailPaths.has(path) || path === "/verify-email") {
        response = await runAuthMailTransaction(options.authPool, options.producer, (tx, guard) => {
          const auth = instance(tx, (purpose, data) =>
            guard(async () => {
              const binding = {
                id: randomUUID(),
                purpose,
                generation: 1,
                recipientKey: abuseKey(options.mail.recipientKey, "mail", data.user.email),
                expiresAt: new Date(
                  Math.floor(Date.now() / 1000) * 1000 +
                    (purpose === "verification" ? 86400000 : 1800000),
                ),
              };
              if (purpose === "verification") {
                // The pinned JWT carries email, not auth-subject identity. Bind it
                // to this exact user and consume it once so email reuse cannot
                // verify a different registration with an old link.
                const { payload } = await jwtVerify(
                  data.token,
                  new TextEncoder().encode(options.secret),
                  { algorithms: ["HS256"] },
                );
                const adapter = auth.$context;
                await (
                  await adapter
                ).internalAdapter.createVerificationValue({
                  identifier: `kairn-email:${createHash("sha256").update(data.token).digest("hex")}`,
                  value: data.user.id,
                  expiresAt: new Date(z.number().parse(payload.exp) * 1000),
                });
              }
              await enqueueAuthMail(
                tx,
                options.producer,
                { ...binding, subject: data.user.id },
                sealMail(
                  binding,
                  { to: data.user.email, url: data.url },
                  options.mail.keyId,
                  options.mail.key,
                ),
              );
            }),
          );
          return auth.handler(request);
        });
      } else response = await current.handler(request);
      if (response.ok) {
        for (const reservation of reservations)
          await options.authPool.query("SELECT operations.release_auth_attempt($1,$2)", [
            reservation.key,
            reservation.at,
          ]);
      }
      if (response.ok && ["/sign-in/email", "/sign-up/email", "/change-password"].includes(path)) {
        const payload = z.record(z.string(), z.unknown()).parse(await response.json());
        if ("token" in payload) payload.token = null;
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        response = Response.json(payload, { status: response.status, headers });
      }
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
      return response;
    } catch {
      return failure(
        503,
        "unavailable",
        "Authentication is temporarily unavailable. Try again later.",
      );
    }
  }
  async function resolve(headers: Headers) {
    const session = await current.api.getSession({ headers });
    if (!session?.user.emailVerified || session.session.expiresAt <= new Date()) return null;
    // ensure_account checks deletion/retired identities on every resolution;
    // email is never a domain identity key.
    let actor;
    try {
      actor = await provisionVerifiedAccount(options.authPool, session.user.id, session.user.name);
    } catch (error) {
      if (z.object({ code: z.literal("42501") }).safeParse(error).success) return null;
      throw new Error("Account service is unavailable.");
    }
    return {
      actor,
      session,
      fresh: Date.now() - session.session.createdAt.getTime() < authOptions.session.freshAge * 1000,
    };
  }
  async function getMyAccount(headers: Headers) {
    const resolved = await resolve(headers);
    if (!resolved) return null;
    return runAsAccount(options.accountPool, resolved.actor, async (tx) => {
      const result = await tx.execute("SELECT display_name, bio, revision FROM identity.profile");
      const profile = z
        .object({
          display_name: z.string(),
          bio: z.string().nullable(),
          revision: z.coerce.number().int().positive(),
        })
        .parse(result.rows[0]);
      return MyAccountSchema.parse({
        accountId: resolved.actor.accountId,
        accountRevision: resolved.actor.accountRevision,
        etag: `"account-${resolved.actor.accountId}-${resolved.actor.accountRevision}"`,
        state: "active",
        emailVerified: true,
        privateEmail: resolved.session.user.email,
        profile: {
          displayName: profile.display_name,
          bio: profile.bio,
          revision: profile.revision,
          etag: `"profile-${resolved.actor.accountId}-${profile.revision}"`,
        },
      });
    });
  }
  return { handle, resolve, getMyAccount };
}

export { createAccountServices } from "./services.js";
