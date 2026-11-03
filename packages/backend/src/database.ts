import { Pool } from "pg";
import { z } from "zod";
import { checkIdentityDatabase } from "./migrations.js";

const DatabaseUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  return ["postgres:", "postgresql:"].includes(url.protocol) && !!url.username && !!url.password;
});

export function readDatabaseUrl(value: string | undefined): string {
  // Do not include the URL or validator input in startup errors.
  const result = DatabaseUrlSchema.safeParse(value);
  if (!result.success) throw new Error("A PostgreSQL connection URL with credentials is required.");
  return result.data;
}

export function createDatabasePool(connectionString: string, applicationName: string, max = 4) {
  return new Pool({
    connectionString,
    application_name: applicationName,
    max,
    connectionTimeoutMillis: 3_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 5_000,
  });
}

export async function checkDatabase(pool: Pool): Promise<void> {
  // Also fails when controlled queue bootstrap has not completed.
  const result = await pool.query("SELECT version FROM pgboss.version");
  if (result.rowCount !== 1) throw new Error("Queue schema is not ready.");
  await checkIdentityDatabase(pool);
}
