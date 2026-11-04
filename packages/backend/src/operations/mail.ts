import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { createTransport } from "nodemailer";
import type { Pool } from "pg";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { createDatabase } from "../database.js";
import { abuseKey } from "./commands.js";
import type { startJobProducer } from "../job-producer.js";
import type { AccountTransaction } from "../identity/context.js";
import { sha256 } from "./journal.js";

/** Better Auth 1.7.15 catches runInBackgroundOrAwait callback errors. Bind its adapter to
 * this exact transaction and await guard() inside each email callback. This outer guard
 * rejects the swallowed failure and rolls back auth rows, mail and pg-boss together.
 * Unknown-recipient successful responses enqueue an ID-only no-op through the same role,
 * so an unavailable enqueue boundary is not exposed only for existing recipients.
 */
export async function runAuthMailTransaction(
  pool: Pool,
  producer: Awaited<ReturnType<typeof startJobProducer>>,
  operation: (
    transaction: AccountTransaction,
    guard: (send: () => Promise<void>) => Promise<void>,
  ) => Promise<Response>,
) {
  const client = await pool.connect();
  let discard = false;
  try {
    return await createDatabase(client).transaction(async (transaction) => {
      let failed = false;
      let called = false;
      let closed = false;
      const pending: Promise<void>[] = [];
      const guard = (send: () => Promise<void>) => {
        const task = (async () => {
          if (closed) throw new Error("Auth mail transaction is closed.");
          called = true;
          try {
            await send();
          } catch {
            failed = true;
            throw new Error("Durable mail unavailable.");
          }
        })();
        pending.push(task);
        void task.catch(() => {});
        return task;
      };
      const response = await (async () => {
        try {
          return await operation(transaction, guard);
        } finally {
          for (let offset = 0; offset < pending.length;) {
            const batch = pending.slice(offset);
            offset += batch.length;
            await Promise.allSettled(batch);
          }
          closed = true;
        }
      })();
      if (failed) throw new Error("Durable mail unavailable.");
      if (!called && response.ok) await producer.email(transaction, randomUUID());
      await transaction.execute(sql`SELECT 1`);
      return response;
    });
  } catch {
    discard = true;
    throw new Error("Authentication mail is unavailable; retry later.");
  } finally {
    client.release(discard);
  }
}

const MailSchema = z.object({
  id: z.uuid(),
  purpose: z.enum(["verification", "password_reset", "invitation", "transfer", "security"]),
  generation: z.number().int().positive(),
  recipientKey: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.coerce.date(),
  keyId: z.string(),
  ciphertext: z.string(),
  nonce: z.string(),
  tag: z.string(),
  recipient: z.email(),
});
const PayloadSchema = z.strictObject({ to: z.email().max(254), url: z.url().max(2048) });
type Binding = {
  id: string;
  purpose: string;
  generation: number;
  recipientKey: string;
  expiresAt: Date;
};
function aad(binding: Binding) {
  return Buffer.from(
    JSON.stringify([
      binding.id,
      binding.purpose,
      binding.generation,
      binding.recipientKey,
      binding.expiresAt.toISOString(),
    ]),
  );
}
export function sealMail(
  binding: Binding,
  payload: z.infer<typeof PayloadSchema>,
  keyId: string,
  key: Buffer,
) {
  if (key.length !== 32 || !/^[A-Za-z0-9_.-]{1,64}$/.test(keyId))
    throw new Error("Invalid mail key.");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(aad(binding));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(PayloadSchema.parse(payload))),
    cipher.final(),
  ]);
  return {
    keyId,
    ciphertext: ciphertext.toString("hex"),
    nonce: nonce.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
  };
}
/** Callback adapter: enqueue on its caller's actual auth transaction. A rejected send must
 * propagate to Better Auth; wrapping a separate connection is not token-persistence atomicity.
 */
export async function enqueueAuthMail(
  transaction: Parameters<Awaited<ReturnType<typeof startJobProducer>>["email"]>[0],
  producer: Awaited<ReturnType<typeof startJobProducer>>,
  input: Binding & { purpose: "verification" | "password_reset"; subject: string },
  sealed: ReturnType<typeof sealMail>,
) {
  await transaction.execute(
    sql`SELECT operations.enqueue_auth_email(${input.id}::uuid,${input.purpose},${input.subject},${input.recipientKey},${input.generation},${input.expiresAt.toISOString()}::timestamptz,${sealed.keyId},${sealed.ciphertext},${sealed.nonce},${sealed.tag})`,
  );
  await producer.email(transaction, input.id);
}
export function createMailTransport(options: {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  localFixture?: boolean;
}) {
  if (!options.localFixture && !options.secure && options.port !== 587)
    throw new Error("SMTP requires TLS.");
  return createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    requireTLS: !options.localFixture,
    auth: options.user ? { user: options.user, pass: options.password } : undefined,
    pool: false,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    logger: false,
    debug: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}
export async function deliverEmail(
  pool: Pool,
  eventId: string,
  options: {
    keys: ReadonlyMap<string, Buffer>;
    recipientKey: Buffer;
    origin: URL;
    from: string;
    transport: ReturnType<typeof createMailTransport>;
  },
) {
  const client = await pool.connect();
  let discard = false;
  let retry = false;
  try {
    await createDatabase(client).transaction(async (tx) => {
      const result = await tx.execute(
        sql`SELECT operations.claim_email(${z.uuid().parse(eventId)}::uuid) AS mail`,
      );
      if (!result.rows[0]?.mail) return;
      const mail = MailSchema.parse(result.rows[0].mail);
      const key = options.keys.get(mail.keyId);
      if (!key || key.length !== 32) throw new Error("Mail key unavailable.");
      const cipher = createDecipheriv("aes-256-gcm", key, Buffer.from(mail.nonce, "hex"));
      cipher.setAAD(aad(mail));
      cipher.setAuthTag(Buffer.from(mail.tag, "hex"));
      const payload = PayloadSchema.parse(
        JSON.parse(
          Buffer.concat([
            cipher.update(Buffer.from(mail.ciphertext, "hex")),
            cipher.final(),
          ]).toString("utf8"),
        ),
      );
      const url = new URL(payload.url);
      const paths: Record<z.infer<typeof MailSchema>["purpose"], string[]> = {
        verification: ["/api/auth/verify-email"],
        password_reset: ["/reset-password"],
        invitation: ["/invitations/resolve"],
        transfer: ["/transfers/resolve"],
        security: ["/account/security"],
      };
      const pathAllowed =
        paths[mail.purpose].includes(url.pathname) ||
        (mail.purpose === "password_reset" &&
          /^\/api\/auth\/reset-password\/[A-Za-z0-9_-]{24,128}$/.test(url.pathname));
      const callback = url.searchParams.get("callbackURL");
      if (
        payload.to.toLowerCase() !== mail.recipient.toLowerCase() ||
        abuseKey(options.recipientKey, "mail", payload.to.toLowerCase()) !== mail.recipientKey ||
        url.origin !== options.origin.origin ||
        !pathAllowed ||
        (callback !== null && new URL(callback, options.origin).origin !== options.origin.origin) ||
        url.username ||
        url.password ||
        mail.expiresAt <= new Date()
      )
        throw new Error("Mail binding unavailable.");
      if (mail.purpose === "password_reset") {
        const token = url.pathname.startsWith("/api/auth/reset-password/")
          ? url.pathname.slice("/api/auth/reset-password/".length)
          : url.searchParams.get("token");
        const current = token
          ? await tx.execute(
              sql`SELECT operations.reset_mail_token_current(${eventId}::uuid,${sha256(token)}) AS current`,
            )
          : null;
        if (current?.rows[0]?.current !== true) {
          await tx.execute(sql`SELECT operations.finish_email(${eventId}::uuid,NULL)`);
          return;
        }
      }
      const subjects = {
        verification: "Verify your Kairn email",
        password_reset: "Reset your Kairn password",
        invitation: "Your Kairn journey invitation",
        transfer: "Kairn administration transfer",
        security: "Kairn account security",
      };
      try {
        const sent = await options.transport.sendMail({
          from: options.from,
          to: payload.to,
          subject: subjects[mail.purpose],
          text: `${subjects[mail.purpose]}\n\n${url.href}\n\nThis link expires. If you did not request it, you can ignore this email.`,
          messageId: `<${mail.id}@kairn.invalid>`,
        });
        if (!sent.accepted?.length) throw new Error("SMTP did not accept mail.");
        await tx.execute(sql`SELECT operations.finish_email(${eventId}::uuid,true)`);
      } catch {
        await tx.execute(sql`SELECT operations.finish_email(${eventId}::uuid,false)`);
        retry = true;
      }
    });
  } catch {
    discard = true;
    await client.query("SELECT operations.mail_failure($1)", [eventId]).catch(() => {});
    throw new Error("Mail delivery unavailable.");
  } finally {
    client.release(discard);
  }
  if (retry) throw new Error("Mail delivery pending.");
}
