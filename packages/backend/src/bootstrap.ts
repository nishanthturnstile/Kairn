import { PgBoss } from "pg-boss";
import { createDatabasePool, readDatabaseUrl } from "./database.js";

// This entry runs only in the one-shot migrate service, with its schema-owner credentials.
const connectionString = readDatabaseUrl(process.env.MIGRATION_DATABASE_URL);
const pool = createDatabasePool(connectionString, "kairn-migrate");
const boss = new PgBoss({
  connectionString,
  max: 2,
  connectionTimeoutMillis: 3_000,
  options: "-c statement_timeout=30000 -c lock_timeout=10000",
  createSchema: false,
  migrate: true,
  supervise: false,
  schedule: false,
  registerInstance: false,
});
boss.on("error", () => console.error("Queue bootstrap database error."));
try {
  await boss.start();
  await pool.query(`
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA pgboss FROM PUBLIC;
    GRANT USAGE ON SCHEMA pgboss TO kairn_server, kairn_worker;
    GRANT SELECT ON pgboss.version TO kairn_server;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pgboss TO kairn_worker;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pgboss TO kairn_worker;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgboss TO kairn_worker;
    ALTER DEFAULT PRIVILEGES IN SCHEMA pgboss
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kairn_worker;
    ALTER DEFAULT PRIVILEGES IN SCHEMA pgboss
      GRANT USAGE, SELECT ON SEQUENCES TO kairn_worker;
    ALTER DEFAULT PRIVILEGES IN SCHEMA pgboss REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
    ALTER DEFAULT PRIVILEGES IN SCHEMA pgboss GRANT EXECUTE ON FUNCTIONS TO kairn_worker;
  `);
  console.log("Queue schema bootstrap complete.");
} catch {
  console.error("Queue schema bootstrap failed; application startup is blocked.");
  process.exitCode = 1;
} finally {
  await boss.stop({ graceful: false });
  await pool.end();
}
