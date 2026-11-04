import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDatabase, createDatabasePool, readDatabaseUrl } from "@kairn/backend/database";
import { authOptions } from "@kairn/backend/auth-options";
import { startJobProducer } from "@kairn/backend/job-producer";
import { runAuthMailTransaction, enqueueAuthMail, sealMail } from "@kairn/backend/mail";
import { abuseKey } from "@kairn/backend/commands";
import { authAdapterSchema } from "@kairn/backend/auth-adapter";
const schema = authAdapterSchema();
if (!process.env.TEST_DOMAIN_ISOLATED) throw new Error("Isolated domain harness required.");
const pool = createDatabasePool(
  readDatabaseUrl(process.env.TEST_AUTH_DATABASE_URL),
  "pinned-auth-callback-fixture",
  2,
);
const producer = await startJobProducer(pool, () => {});
/** @param {Parameters<typeof drizzleAdapter>[0]} database @param {(purpose:"verification"|"password_reset",data:{user:{id:string,email:string},url:string})=>Promise<void>} send */
function createAuth(database, send, background = false) {
  return betterAuth({
    ...authOptions,
    ...(background ? { advanced: { backgroundTasks: { handler: () => {} } } } : {}),
    secret: randomBytes(32).toString("base64url"),
    baseURL: "https://kairn.invalid",
    logger: { disabled: true },
    rateLimit: { enabled: false },
    database: drizzleAdapter(database, { provider: "pg", schema, transaction: true }),
    emailVerification: {
      ...authOptions.emailVerification,
      sendVerificationEmail: (data) => send("verification", data),
    },
    emailAndPassword: {
      ...authOptions.emailAndPassword,
      sendResetPassword: (data) => send("password_reset", data),
    },
  });
}
/** @param {ReturnType<typeof createAuth>} auth @param {string} path @param {Record<string,unknown>} body */
const request = (auth, path, body) =>
  auth.handler(
    new Request(`https://kairn.invalid/api/auth/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://kairn.invalid" },
      body: JSON.stringify(body),
    }),
  );
try {
  let calls = 0;
  const unguarded = createAuth(createDatabase(pool), async () => {
    calls++;
    throw new Error("durable mail unavailable");
  });
  const email = `${randomUUID()}@kairn.invalid`;
  assert.equal(
    (
      await request(unguarded, "sign-up/email", {
        name: "Callback fixture",
        email,
        password: `Aa1!${randomUUID()}`,
      })
    ).status,
    200,
  );
  assert.equal(calls, 1);
  assert.equal(
    (await pool.query('SELECT id FROM authn."user" WHERE email=$1', [email])).rowCount,
    1,
    "Pinned runInBackgroundOrAwait swallows callback rejection and commits signup.",
  );
  const resetSubject = randomUUID();
  const resetEmail = `${resetSubject}@kairn.invalid`;
  await pool.query('INSERT INTO authn."user"(id,name,email,email_verified) VALUES($1,$2,$3,true)', [
    resetSubject,
    "Reset fixture",
    resetEmail,
  ]);
  assert.equal(
    (
      await request(unguarded, "request-password-reset", {
        email: resetEmail,
        redirectTo: "https://kairn.invalid/reset-password",
      })
    ).status,
    200,
  );
  assert.equal(
    (await pool.query("SELECT id FROM authn.verification WHERE value=$1", [resetSubject])).rowCount,
    1,
  );
  const failedEmail = `${randomUUID()}@kairn.invalid`;
  await assert.rejects(
    runAuthMailTransaction(pool, producer, async (tx, guard) => {
      const auth = createAuth(
        tx,
        async () =>
          guard(async () => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            throw new Error("enqueue rejected");
          }),
        true,
      );
      return request(auth, "sign-up/email", {
        name: "Guarded rollback",
        email: failedEmail,
        password: `Aa1!${randomUUID()}`,
      });
    }),
  );
  assert.equal(
    (await pool.query('SELECT id FROM authn."user" WHERE email=$1', [failedEmail])).rowCount,
    0,
    "Outer transaction must roll back despite the library's swallowed callback failure.",
  );
  await assert.rejects(
    runAuthMailTransaction(pool, producer, async (tx, guard) => {
      const auth = createAuth(tx, async () =>
        guard(async () => {
          throw new Error("enqueue rejected");
        }),
      );
      return request(auth, "request-password-reset", {
        email: resetEmail,
        redirectTo: "https://kairn.invalid/reset-password",
      });
    }),
  );
  assert.equal(
    (await pool.query("SELECT id FROM authn.verification WHERE value=$1", [resetSubject])).rowCount,
    1,
    "Guarded failure cannot commit another reset token.",
  );
  const successEmail = `${randomUUID()}@kairn.invalid`;
  const key = Buffer.from(process.env.TEST_CALLBACK_MAIL_KEY ?? "", "base64url");
  const recipientKey = Buffer.from(process.env.TEST_CALLBACK_RECIPIENT_KEY ?? "", "base64url");
  const success = await runAuthMailTransaction(pool, producer, async (tx, guard) => {
    const auth = createAuth(tx, async (purpose, data) =>
      guard(async () => {
        const binding = {
          id: randomUUID(),
          purpose,
          generation: 1,
          recipientKey: abuseKey(recipientKey, "mail", data.user.email),
          expiresAt: new Date(
            Math.floor(Date.now() / 1000) * 1000 +
              (purpose === "verification" ? 86400000 : 1800000),
          ),
        };
        await enqueueAuthMail(
          tx,
          producer,
          { ...binding, subject: data.user.id },
          sealMail(binding, { to: data.user.email, url: data.url }, "v1", key),
        );
      }),
    );
    return request(auth, "sign-up/email", {
      name: "Guarded commit",
      email: successEmail,
      password: `Aa1!${randomUUID()}`,
    });
  });
  assert.equal(success.status, 200);
  assert.equal(
    (await pool.query('SELECT id FROM authn."user" WHERE email=$1', [successEmail])).rowCount,
    1,
  );
  const resetSuccess = await runAuthMailTransaction(pool, producer, async (tx, guard) => {
    const auth = createAuth(tx, async (purpose, data) =>
      guard(async () => {
        const binding = {
          id: randomUUID(),
          purpose,
          generation: 1,
          recipientKey: abuseKey(recipientKey, "mail", data.user.email),
          expiresAt: new Date(Math.floor(Date.now() / 1000) * 1000 + 1800000),
        };
        await enqueueAuthMail(
          tx,
          producer,
          { ...binding, subject: data.user.id },
          sealMail(binding, { to: data.user.email, url: data.url }, "v1", key),
        );
      }),
    );
    return request(auth, "request-password-reset", {
      email: resetEmail,
      redirectTo: "https://kairn.invalid/reset-password",
    });
  });
  assert.equal(resetSuccess.status, 200);
  const unknown = await runAuthMailTransaction(pool, producer, async (tx, guard) =>
    request(
      createAuth(tx, async () =>
        guard(async () => {
          throw new Error("Unknown recipient must not invoke callback");
        }),
      ),
      "request-password-reset",
      {
        email: `${randomUUID()}@kairn.invalid`,
        redirectTo: "https://kairn.invalid/reset-password",
      },
    ),
  );
  assert.equal(unknown.status, 200);
  console.log(
    "PASS actual pinned callback behavior, guarded signup/reset rollback, atomic sealed-mail signup and unknown-recipient enqueue boundary.",
  );
} finally {
  await producer.stop();
  await pool.end();
}
