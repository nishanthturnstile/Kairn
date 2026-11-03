import type { Pool, PoolClient } from "pg";
import { sql } from "drizzle-orm";
import { fromDrizzle, PgBoss } from "pg-boss";
import { z } from "zod";
import type { AccountTransaction } from "./identity/context.js";

export const productQueues = {
  email: "kairn.email.v1",
  restriction: "kairn.restriction.confirm.v1",
  cleanup: "kairn.lifecycle.cleanup.v1",
  avatar: "kairn.identity.avatar.v1",
} as const;

const QueueSchema = z.object({
  name: z.enum(Object.values(productQueues)),
  table_name: z.string().min(1),
  policy: z.literal("standard"),
  partition: z.literal(true),
  notify: z.literal(false),
});

/** Catalog/ACL readiness only. No payload reads and no schema changes. */
export async function checkJobProducerDatabase(database: Pool | PoolClient) {
  const queues = z
    .array(QueueSchema)
    .parse(
      (
        await database.query(
          "SELECT name, table_name, policy, partition, notify FROM pgboss.queue WHERE name = ANY($1::text[]) ORDER BY name",
          [Object.values(productQueues)],
        )
      ).rows,
    );
  if (queues.length !== 4 || new Set(queues.map((queue) => queue.table_name)).size !== 4)
    throw new Error("Product queues are incomplete.");
  const email = queues.find((queue) => queue.name === productQueues.email);
  if (!email) throw new Error("Email queue is unavailable.");
  const result = await database.query(
    `WITH producers AS (
      SELECT 'kairn_server'::text AS role, $1::text[] AS allowed
      UNION ALL SELECT 'kairn_auth', ARRAY[$2::text]
    ), relations AS (
      SELECT c.oid, c.relname FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'pgboss' AND c.relkind IN ('r', 'p')
    ) SELECT
      NOT EXISTS (SELECT FROM producers p CROSS JOIN relations r WHERE
        pg_catalog.has_any_column_privilege(p.role, r.oid, 'INSERT') <> (r.relname = ANY(p.allowed))
        OR pg_catalog.has_table_privilege(p.role, r.oid, 'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        OR pg_catalog.has_any_column_privilege(p.role, r.oid, 'UPDATE,REFERENCES')
        OR CASE WHEN r.relname = ANY(p.allowed) THEN
          NOT pg_catalog.has_table_privilege(p.role, r.oid, 'INSERT')
          OR NOT pg_catalog.has_column_privilege(p.role, r.oid, 'id', 'SELECT')
          OR EXISTS (SELECT FROM pg_catalog.pg_attribute a WHERE a.attrelid = r.oid
            AND a.attnum > 0 AND NOT a.attisdropped AND a.attname <> 'id'
            AND pg_catalog.has_column_privilege(p.role, r.oid, a.attnum, 'SELECT'))
        ELSE CASE WHEN r.relname IN ('queue', 'version') THEN
          NOT pg_catalog.has_table_privilege(p.role, r.oid, 'SELECT')
        ELSE pg_catalog.has_any_column_privilege(p.role, r.oid, 'SELECT') END END
      )
      AND NOT EXISTS (SELECT FROM producers p WHERE
        NOT pg_catalog.has_schema_privilege(p.role, 'pgboss', 'USAGE')
        OR pg_catalog.has_schema_privilege(p.role, 'pgboss', 'CREATE')
        OR pg_catalog.pg_has_role(p.role, 'kairn_worker', 'SET')
        OR pg_catalog.pg_has_role(p.role, 'kairn_migrator', 'SET')
        OR NOT pg_catalog.has_function_privilege(p.role, 'pgboss.job_now()', 'EXECUTE'))
      AND NOT pg_catalog.pg_has_role('kairn_auth', 'kairn_server', 'SET')
      AND NOT EXISTS (SELECT FROM producers p CROSS JOIN pg_catalog.pg_proc f
        JOIN pg_catalog.pg_namespace n ON n.oid = f.pronamespace
        WHERE n.nspname = 'pgboss' AND pg_catalog.has_function_privilege(p.role, f.oid, 'EXECUTE')
          <> (f.proname = 'job_now' AND f.pronargs = 0))
      AND NOT EXISTS (SELECT FROM producers p CROSS JOIN pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'pgboss' AND c.relkind = 'S'
          AND pg_catalog.has_sequence_privilege(p.role, c.oid, 'USAGE,SELECT,UPDATE'))
      AND (SELECT count(*) = 4 FROM pg_catalog.pg_inherits i
        JOIN relations child ON child.oid = i.inhrelid
        JOIN relations parent ON parent.oid = i.inhparent
        WHERE child.relname = ANY($1::text[]) AND parent.relname = 'job')
      AS valid`,
    [queues.map((queue) => queue.table_name), email.table_name],
  );
  if (result.rows[0]?.valid !== true)
    throw new Error("Job producer privileges are incomplete or unsafe.");
}

/** One process-owned bounded metadata pool, shared across sends. Caller owns its lifetime.
 * Writes always use the supplied domain/auth transaction, never this metadata connection.
 */
export async function startJobProducer(metadata: Pool, onError: () => void) {
  const metadataError = () => onError();
  metadata.on("error", metadataError);
  const queue = new PgBoss({
    db: { executeSql: (text, values) => metadata.query(text, values) },
    schema: "pgboss",
    migrate: false,
    createSchema: false,
    supervise: false,
    schedule: false,
    registerInstance: false,
    persistWarnings: false,
    persistQueueStats: false,
    reindex: false,
    useListenNotify: false,
    openTelemetry: { enabled: false },
  });
  queue.on("error", onError);
  try {
    await checkJobProducerDatabase(metadata);
    await queue.start();
  } catch (error) {
    await queue.stop({ graceful: false });
    metadata.off("error", metadataError);
    throw error;
  }
  async function enqueue(
    transaction: AccountTransaction,
    name: (typeof productQueues)[keyof typeof productQueues],
    eventId: string,
  ) {
    const id = z.uuid().parse(eventId);
    const inserted = await queue.send(
      name,
      { eventId: id },
      { id, db: fromDrizzle(transaction, sql) },
    );
    // A duplicate UUID is not a command receipt or proof of equal payload/current authority.
    // Services must resolve their durable event/command identity before invoking this boundary.
    return { id, inserted: inserted !== null };
  }
  return {
    email: (transaction: AccountTransaction, eventId: string) =>
      enqueue(transaction, productQueues.email, eventId),
    restriction: (transaction: AccountTransaction, eventId: string) =>
      enqueue(transaction, productQueues.restriction, eventId),
    cleanup: (transaction: AccountTransaction, eventId: string) =>
      enqueue(transaction, productQueues.cleanup, eventId),
    avatar: (transaction: AccountTransaction, eventId: string) =>
      enqueue(transaction, productQueues.avatar, eventId),
    stop: async () => {
      try {
        await queue.stop({ graceful: false });
      } finally {
        metadata.off("error", metadataError);
      }
    },
  };
}
