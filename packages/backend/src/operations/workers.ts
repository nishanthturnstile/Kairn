import type { PgBoss } from "pg-boss";
import type { Pool } from "pg";
import { z } from "zod";
import { productQueues } from "../job-producer.js";
import { confirmRestriction, type RestrictionJournal } from "./journal.js";
import { deliverEmail } from "./mail.js";
import { processAvatar, PrivateIdentityStorage } from "../identity/media.js";

export async function cleanupAvatars(pool: Pool, storage: PrivateIdentityStorage) {
  const rows = await pool.query("SELECT operations.avatar_cleanup_batch() AS batch");
  const batch = z
    .array(
      z.object({
        id: z.uuid(),
        owner_account_id: z.uuid(),
        quarantine_bucket: z.string(),
        quarantine_key: z.string(),
        representation_bucket: z.string().nullable(),
        representation_key: z.string().nullable(),
      }),
    )
    .max(20)
    .parse(rows.rows[0]?.batch);
  for (const avatar of batch) {
    await storage.delete(avatar.quarantine_bucket, avatar.quarantine_key);
    if (avatar.representation_bucket && avatar.representation_key)
      await storage.delete(avatar.representation_bucket, avatar.representation_key);
    else
      await storage.delete(storage.bucket, `avatars/${avatar.owner_account_id}/${avatar.id}.jpg`);
    await pool.query("SELECT operations.finish_avatar_cleanup($1)", [avatar.id]);
  }
}
/** Exactly one domain pool per process. Queue payloads are only durable IDs. */
export async function registerDomainWorkers(
  queue: PgBoss,
  pool: Pool,
  options: {
    journal: RestrictionJournal;
    storage: PrivateIdentityStorage;
    mail: Parameters<typeof deliverEmail>[2];
    onError: () => void;
  },
) {
  const payload = z.strictObject({ eventId: z.uuid() });
  await queue.work(
    productQueues.restriction,
    { batchSize: 1, localConcurrency: 1 },
    async (jobs) => {
      for (const job of jobs)
        await confirmRestriction(pool, options.journal, payload.parse(job.data).eventId);
    },
  );
  await queue.work(productQueues.email, { batchSize: 1, localConcurrency: 1 }, async (jobs) => {
    for (const job of jobs) await deliverEmail(pool, payload.parse(job.data).eventId, options.mail);
  });
  await queue.work(productQueues.avatar, { batchSize: 1, localConcurrency: 1 }, async (jobs) => {
    for (const job of jobs)
      await processAvatar(pool, payload.parse(job.data).eventId, options.storage);
  });
  await queue.work(productQueues.cleanup, { batchSize: 1, localConcurrency: 1 }, async (jobs) => {
    for (const job of jobs)
      await pool.query("SELECT operations.cleanup_unit($1)", [payload.parse(job.data).eventId]);
    await cleanupAvatars(pool, options.storage);
  });
  let running: Promise<void> | undefined;
  let stopped = false;
  async function reconcile() {
    await pool.query("SELECT operations.purge_expired_mail()");
    await pool.query("SELECT operations.retention_unit()");
    const restored = await pool.query("SELECT operations.restored_cleanup_targets() AS accounts");
    for (const id of z.array(z.uuid()).max(20).parse(restored.rows[0]?.accounts))
      await pool.query("SELECT operations.cleanup_unit($1)", [id]);
    const pending = await pool.query("SELECT operations.pending_work() AS work");
    const work = z
      .array(
        z.object({
          type: z.enum(["restriction", "email", "avatar", "cleanup"]),
          eventId: z.uuid(),
        }),
      )
      .max(80)
      .parse(pending.rows[0]?.work);
    for (const item of work) {
      if (stopped) break;
      try {
        if (item.type === "restriction")
          await confirmRestriction(pool, options.journal, item.eventId);
        else if (item.type === "email") await deliverEmail(pool, item.eventId, options.mail);
        else if (item.type === "avatar") await processAvatar(pool, item.eventId, options.storage);
        else await pool.query("SELECT operations.cleanup_unit($1)", [item.eventId]);
      } catch {
        options.onError();
      }
    }
    // A storage/configuration failure must not suppress durable restriction retries
    // after ordinary queue retries have been exhausted.
    await cleanupAvatars(pool, options.storage).catch(options.onError);
  }
  const timer = setInterval(() => {
    if (!stopped && !running)
      running = reconcile()
        .catch(options.onError)
        .finally(() => {
          running = undefined;
        });
  }, 30000);
  return {
    stop: async () => {
      stopped = true;
      clearInterval(timer);
      await running;
    },
  };
}
