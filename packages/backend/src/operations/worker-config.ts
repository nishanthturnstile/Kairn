import { readFile, stat } from "node:fs/promises";
import { z } from "zod";
import { S3Client } from "@aws-sdk/client-s3";
import { HttpRestrictionJournal } from "./journal.js";
import { PrivateIdentityStorage } from "../identity/media.js";
import { createMailTransport } from "./mail.js";

/** Server-only secret file, mounted read-only. No defaults enable production domain workers. */
async function readDomainWorkerConfig(path: string, accountOnly = false) {
  const info = await stat(path);
  if (!info.isFile() || (info.mode & 0o077) !== 0 || info.size > 32768)
    throw new Error("Domain worker configuration requires a private bounded file.");
  const secret = z.string().min(32).max(512);
  const key = z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/)
    .transform((value) => Buffer.from(value, "base64url"));
  const config = z
    .strictObject({
      journal: z
        .strictObject({
          endpoint: z.url(),
          token: secret,
          keys: z.record(z.string().min(1).max(64), key),
        })
        .optional(),
      storage: z.strictObject({
        endpoint: z.url(),
        bucket: z.string(),
        accessKey: accountOnly ? z.string().min(1) : secret,
        secretKey: accountOnly ? z.string().min(1) : secret,
      }),
      mail: z.strictObject({
        origin: z.url(),
        from: z.email(),
        host: z.string(),
        port: z.number().int().min(1).max(65535),
        secure: z.boolean(),
        user: z.string(),
        password: accountOnly ? z.string() : secret,
        localFixture: z.boolean().default(false),
        keys: z.record(z.string().min(1).max(64), key),
        recipientKey: key,
      }),
    })
    .parse(JSON.parse(await readFile(path, "utf8")));
  if (!config.journal && !accountOnly) throw new Error("Independent journal required.");
  if (config.mail.localFixture && !accountOnly)
    throw new Error("Fixture mail requires local account mode.");
  const origin = new URL(config.mail.origin);
  if (origin.protocol !== "https:") throw new Error("Mail origin requires HTTPS.");
  const client = new S3Client({
    endpoint: config.storage.endpoint,
    region: "us-east-1",
    forcePathStyle: true,
    maxAttempts: 1,
    credentials: {
      accessKeyId: config.storage.accessKey,
      secretAccessKey: config.storage.secretKey,
    },
  });
  const transport = createMailTransport(config.mail);
  return {
    journal: config.journal
      ? new HttpRestrictionJournal(
          new URL(config.journal.endpoint),
          config.journal.token,
          new Map(Object.entries(config.journal.keys)),
        )
      : {
          append: async () => {
            throw new Error("Independent recovery is not configured; restriction remains pending.");
          },
          read: async () => {
            throw new Error("Independent recovery is not configured.");
          },
        },
    storage: new PrivateIdentityStorage(client, config.storage.bucket),
    mail: {
      origin,
      from: config.mail.from,
      transport,
      keys: new Map(Object.entries(config.mail.keys)),
      recipientKey: config.mail.recipientKey,
    },
    close: () => {
      transport.close();
      client.destroy();
    },
  };
}

export async function loadDomainWorkerConfig(path: string) {
  try {
    return await readDomainWorkerConfig(path);
  } catch {
    throw new Error("Domain worker configuration is unavailable or invalid.");
  }
}

export async function loadAccountWorkerConfig(path: string) {
  try {
    return await readDomainWorkerConfig(path, true);
  } catch {
    throw new Error("Account worker configuration is unavailable or invalid.");
  }
}
