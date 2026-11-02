import { PgBoss } from "pg-boss";

/** Runtime cannot install or migrate the queue schema. Queue creation belongs to bootstrap. */
export function createJobQueue(connectionString: string) {
  return new PgBoss({
    connectionString,
    schema: "pgboss",
    max: 4,
    connectionTimeoutMillis: 3_000,
    options: "-c statement_timeout=5000",
    migrate: false,
    createSchema: false,
    schedule: false,
    persistQueueStats: false,
    // Index rebuilds need the schema owner and belong in controlled maintenance.
    reindex: false,
  });
}
