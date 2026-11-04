import type { Pool } from "pg";
import type { PgBoss } from "pg-boss";
import { checkJobProducerDatabase, productQueues } from "./job-producer.js";

function identifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Controlled migrator only. Queue creation precedes transactional ACL installation.
 * A partial/failed bootstrap keeps application readiness closed and is safe to repeat.
 */
export async function provisionProductQueues(pool: Pool, queue: PgBoss) {
  const partitions = [];
  for (const name of Object.values(productQueues)) {
    await queue.createQueue(name, { policy: "standard", partition: true, notify: false });
    const metadata = await queue.getQueue(name);
    if (
      !metadata ||
      metadata.policy !== "standard" ||
      !metadata.partition ||
      metadata.notify ||
      !metadata.table
    )
      throw new Error("Product queue configuration differs from the reviewed bootstrap.");
    partitions.push({ name, table: metadata.table });
  }
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query("BEGIN");
    await client.query(`
      REVOKE ALL ON ALL TABLES IN SCHEMA pgboss FROM kairn_server, kairn_auth;
      REVOKE ALL ON ALL SEQUENCES IN SCHEMA pgboss FROM kairn_server, kairn_auth;
      REVOKE ALL ON ALL FUNCTIONS IN SCHEMA pgboss FROM kairn_server, kairn_auth;
      GRANT USAGE ON SCHEMA pgboss TO kairn_server, kairn_auth;
      GRANT SELECT ON pgboss.version, pgboss.queue TO kairn_server, kairn_auth;
      GRANT EXECUTE ON FUNCTION pgboss.job_now() TO kairn_server, kairn_auth;
    `);
    for (const partition of partitions) {
      const roles =
        partition.name === productQueues.email ? "kairn_server, kairn_auth" : "kairn_server";
      await client.query(
        `GRANT INSERT, SELECT (id) ON pgboss.${identifier(partition.table)} TO ${roles}`,
      );
    }
    await checkJobProducerDatabase(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {
      discard = true;
    });
    throw error;
  } finally {
    client.release(discard);
  }
}
