import type { Pool, PoolClient } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { DisplayNameSchema } from "@kairn/contracts";

const ActorSchema = z.object({
  accountId: z.uuid(),
  accountRevision: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  accountPolicyGeneration: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
export type AccountActor = z.infer<typeof ActorSchema>;
function accountDatabase(client: PoolClient) {
  return drizzle(client);
}
export type AccountTransaction = Parameters<
  Parameters<ReturnType<typeof accountDatabase>["transaction"]>[0]
>[0];

/** Trusted auth integration only: resolve the library session before passing its subject here. */
export async function provisionVerifiedAccount(
  authPool: Pool,
  subject: string,
  displayName: string,
) {
  const name = DisplayNameSchema.parse(displayName);
  const result = await authPool.query(
    `SELECT account_id AS "accountId", account_revision AS "accountRevision",
    account_policy_generation AS "accountPolicyGeneration" FROM identity.ensure_account($1, $2)`,
    [subject, name],
  );
  return ActorSchema.parse(result.rows[0]);
}

/** One connection/transaction; only a server-resolved actor may enter, never request JSON. */
export async function runAsAccount<T>(
  pool: Pool,
  actor: AccountActor,
  operation: (transaction: AccountTransaction) => Promise<T>,
): Promise<T> {
  const verified = ActorSchema.parse(actor);
  const client = await pool.connect();
  let discard = false;
  try {
    return await accountDatabase(client).transaction(async (transaction) => {
      await transaction.execute(
        sql`SELECT pg_catalog.set_config('kairn.account_id', ${verified.accountId}, true)`,
      );
      const eligible = await transaction.execute(sql`
        SELECT id FROM identity.account WHERE id = ${verified.accountId} AND state = 'active'
        AND revision = ${verified.accountRevision} AND policy_generation = ${verified.accountPolicyGeneration}
      `);
      if (eligible.rowCount !== 1) throw new Error("Account access is unavailable.");
      const result = await operation(transaction);
      // PostgreSQL answers COMMIT with ROLLBACK after a swallowed SQL error. Reject it before
      // Drizzle commits so the caller cannot receive a successful result for discarded writes.
      await transaction.execute(sql`SELECT 1`);
      return result;
    });
  } catch (error) {
    // Drizzle owns rollback. Discard on failure as well, including a failed rollback/socket.
    discard = true;
    throw error;
  } finally {
    client.release(discard);
  }
}
