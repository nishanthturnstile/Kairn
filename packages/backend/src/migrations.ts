import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import { assertFoundationStructure } from "./foundation/readiness.js";
import { assertJourneyStructure } from "./journeys/readiness.js";
import { assertCommandStructure, domainBoundaryHash } from "./operations/readiness.js";

const ManifestSchema = z.strictObject({
  version: z.literal(1),
  migrations: z
    .array(
      z.strictObject({
        file: z.string().regex(/^\d{4}_[a-z0-9_]+\.sql$/),
        sha256: z.string().regex(/^[0-9a-f]{64}$/),
      }),
    )
    .min(1),
});
const AppliedSchema = z.array(
  z.object({ position: z.number().int(), id: z.string(), sha256: z.string() }),
);
export async function readIdentityMigrations(folder = new URL("./migrations/", import.meta.url)) {
  const manifest = ManifestSchema.parse(
    JSON.parse(await readFile(new URL("manifest.json", folder), "utf8")),
  );
  const migrations = await Promise.all(
    manifest.migrations.map(async (entry) => {
      const sql = await readFile(new URL(entry.file, folder), "utf8");
      if (createHash("sha256").update(sql).digest("hex") !== entry.sha256)
        throw new Error("Migration checksum differs from the reviewed manifest.");
      return { ...entry, sql };
    }),
  );
  if (
    new Set(migrations.map((entry) => entry.file)).size !== migrations.length ||
    migrations.some((entry, index) => !entry.file.startsWith(`${String(index).padStart(4, "0")}_`))
  )
    throw new Error("Invalid migration order.");
  return migrations;
}
function verifyApplied(
  rows: unknown,
  migrations: Awaited<ReturnType<typeof readIdentityMigrations>>,
) {
  const applied = AppliedSchema.parse(rows);
  if (applied.length > migrations.length) throw new Error("Unsupported newer identity schema.");
  for (const [index, row] of applied.entries()) {
    const expected = migrations[index];
    if (
      !expected ||
      row.position !== index ||
      row.id !== expected.file ||
      row.sha256 !== expected.sha256
    )
      throw new Error("Applied migration identity/checksum differs.");
  }
  return applied.length;
}
export async function migrateIdentity(pool: Pool, folder?: URL) {
  const migrations = await readIdentityMigrations(folder);
  const client = await pool.connect();
  let locked = false;
  let discard = false;
  try {
    await client.query("SELECT pg_catalog.pg_advisory_lock(1667328366, 1)");
    locked = true;
    const roles = await client.query(
      "SELECT rolname FROM pg_catalog.pg_roles WHERE rolname IN ('kairn_auth', 'kairn_identity', 'kairn_journey_policy', 'kairn_access_policy', 'kairn_command') AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication AND (rolname = 'kairn_auth' OR NOT rolcanlogin)",
    );
    if (roles.rowCount !== 5)
      throw new Error("Controlled identity principal bootstrap is required.");
    await client.query("BEGIN");
    await client.query("SET LOCAL search_path = pg_catalog");
    await client.query(`CREATE SCHEMA IF NOT EXISTS kairn_migrations;
      CREATE TABLE IF NOT EXISTS kairn_migrations.identity_release (
        position integer PRIMARY KEY, id text UNIQUE NOT NULL, sha256 text NOT NULL,
        policies_sha256 text, applied_at timestamptz NOT NULL DEFAULT now()
      );
      REVOKE ALL ON SCHEMA kairn_migrations FROM PUBLIC;
      REVOKE ALL ON kairn_migrations.identity_release FROM PUBLIC;
      GRANT USAGE ON SCHEMA kairn_migrations TO kairn_server, kairn_worker, kairn_auth;
      GRANT SELECT ON kairn_migrations.identity_release TO kairn_server, kairn_worker, kairn_auth;`);
    const applied = verifyApplied(
      (
        await client.query(
          "SELECT position, id, sha256 FROM kairn_migrations.identity_release ORDER BY position",
        )
      ).rows,
      migrations,
    );
    if (applied > 0) await assertIdentityPolicies(client, applied - 1);
    if (applied > 8) await assertCommandStructure(client);
    for (let index = applied; index < migrations.length; index++) {
      const migration = migrations[index];
      if (!migration) throw new Error("Missing ordered migration.");
      await client.query(migration.sql);
      await client.query(
        "INSERT INTO kairn_migrations.identity_release (position, id, sha256) VALUES ($1, $2, $3)",
        [index, migration.file, migration.sha256],
      );
    }
    await assertIdentityStructure(client);
    if (migrations.length > 2) await assertJourneyStructure(client);
    if (migrations.length > 4) await assertFoundationStructure(client);
    if (migrations.length > 8 && applied < migrations.length)
      await client.query(
        "UPDATE kairn_migrations.identity_release SET boundary_sha256=$1 WHERE position=$2",
        [await domainBoundaryHash(client), migrations.length - 1],
      );
    if (migrations.length > 8) await assertCommandStructure(client);
    if (applied < migrations.length)
      await client.query(
        "UPDATE kairn_migrations.identity_release SET policies_sha256 = $1 WHERE position = $2",
        [await identityPoliciesHash(client, migrations.length - 1), migrations.length - 1],
      );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {
      discard = true;
    });
    throw error;
  } finally {
    if (locked && !discard)
      await client.query("SELECT pg_catalog.pg_advisory_unlock(1667328366, 1)").catch(() => {
        discard = true;
      });
    client.release(discard);
  }
}
// Deparse under the transaction's fixed search_path so equivalent role connections get the
// same schema qualification. Capture only after reviewed DDL; never adopt drift on a repeat.
async function identityPoliciesHash(client: PoolClient, position: number) {
  const result = await client.query(
    `SELECT coalesce(jsonb_agg(jsonb_build_object(
    'table', tablename, 'name', policyname, 'permissive', permissive, 'roles', roles,
    'command', cmd, 'using', qual, 'check', with_check
  ) || CASE WHEN schemaname = 'identity' THEN '{}'::jsonb ELSE jsonb_build_object('schema', schemaname) END
  ORDER BY schemaname, tablename, policyname), '[]'::jsonb)::text AS definition
  FROM pg_catalog.pg_policies WHERE schemaname = 'identity' OR ($1 AND schemaname = 'journeys') OR ($2 AND schemaname IN ('sources', 'operations'))`,
    [position >= 2, position >= 4],
  );
  return createHash("sha256").update(z.string().parse(result.rows[0]?.definition)).digest("hex");
}
async function assertIdentityPolicies(client: PoolClient, position: number) {
  const result = await client.query(
    "SELECT policies_sha256 FROM kairn_migrations.identity_release WHERE position = $1",
    [position],
  );
  if (result.rows[0]?.policies_sha256 !== (await identityPoliciesHash(client, position)))
    throw new Error("Identity policies differ from the applied release.");
}
async function assertIdentityStructure(client: Pool | PoolClient) {
  const tables =
    await client.query(`SELECT c.relname FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'identity' AND c.relname IN ('account', 'profile', 'retired_auth_subject') AND c.relrowsecurity AND c.relforcerowsecurity`);
  const policies =
    await client.query(`SELECT policyname FROM pg_catalog.pg_policies WHERE schemaname = 'identity'
    AND policyname IN ('account_owner_read', 'profile_owner_read', 'profile_owner_update', 'account_provision_read', 'account_provision_insert', 'profile_provision_read', 'profile_provision_insert', 'retired_provision_read')`);
  const hasCommands =
    (
      await client.query(
        "SELECT EXISTS(SELECT FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='operations' AND p.proname='execute_command') AS installed",
      )
    ).rows[0]?.installed === true;
  if (tables.rowCount !== 3 || policies.rowCount !== (hasCommands ? 7 : 8))
    throw new Error("Identity policies are incomplete.");
  // Resolve catalog OIDs without requiring the worker to gain identity-schema USAGE.
  const privileges = await client.query(`WITH objects AS (
    SELECT
      (SELECT c.oid FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
        WHERE n.nspname = 'identity' AND c.relname = 'profile') AS profile_id,
      (SELECT c.oid FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
        WHERE n.nspname = 'identity' AND c.relname = 'account') AS account_id,
      (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'identity') AS identity_id,
      (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'authn') AS authn_id,
      (SELECT p.oid FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
        WHERE n.nspname = 'identity' AND p.proname = 'ensure_account' AND p.proargtypes = '25 25'::oidvector) AS provision_id
    ) SELECT
    (SELECT count(*) = 4 FROM pg_catalog.pg_roles WHERE rolname IN
      ('kairn_server', 'kairn_worker', 'kairn_auth', 'kairn_identity')
      AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication
      AND (rolname <> 'kairn_identity' OR NOT rolcanlogin))
    AND NOT EXISTS (SELECT FROM pg_catalog.pg_roles AS r
      WHERE r.rolname IN ('kairn_server', 'kairn_worker', 'kairn_auth')
      AND (pg_catalog.pg_has_role(r.oid, 'kairn_migrator', 'SET')
        OR pg_catalog.pg_has_role(r.oid, 'kairn_identity', 'SET')
        OR pg_catalog.has_schema_privilege(r.oid, o.identity_id, 'CREATE')
        OR pg_catalog.has_schema_privilege(r.oid, o.authn_id, 'CREATE')))
    AND pg_catalog.has_table_privilege('kairn_server', o.profile_id, 'SELECT')
    AND pg_catalog.has_column_privilege('kairn_server', o.profile_id, 'display_name', 'UPDATE') = ${!hasCommands}
    AND pg_catalog.has_column_privilege('kairn_server', o.profile_id, 'bio', 'UPDATE') = ${!hasCommands}
    AND pg_catalog.has_column_privilege('kairn_server', o.profile_id, 'revision', 'UPDATE') = ${!hasCommands}
    AND NOT pg_catalog.has_column_privilege('kairn_server', o.account_id, 'auth_subject_id', 'SELECT')
    AND NOT pg_catalog.has_table_privilege('kairn_auth', o.profile_id, 'SELECT,INSERT,UPDATE,DELETE')
    AND NOT pg_catalog.has_schema_privilege('kairn_server', o.authn_id, 'USAGE')
    AND NOT pg_catalog.has_schema_privilege('kairn_worker', o.identity_id, 'USAGE')
    AND pg_catalog.has_function_privilege('kairn_auth', o.provision_id, 'EXECUTE')
    AND NOT pg_catalog.has_function_privilege('kairn_server', o.provision_id, 'EXECUTE')
    AND NOT pg_catalog.has_function_privilege('kairn_worker', o.provision_id, 'EXECUTE')
    AND EXISTS (SELECT FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_roles AS r ON r.oid = p.proowner
      WHERE p.oid = o.provision_id AND p.prosecdef
      AND r.rolname = 'kairn_identity' AND p.proconfig @> ARRAY['search_path=""', 'kairn.verified_auth_subject='])
    AS valid FROM objects AS o`);
  if (privileges.rows[0]?.valid !== true)
    throw new Error("Identity privileges are incomplete or unsafe.");
}
export async function checkIdentityDatabase(pool: Pool) {
  const migrations = await readIdentityMigrations();
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query("BEGIN READ ONLY");
    await client.query("SET LOCAL search_path = pg_catalog");
    const applied = verifyApplied(
      (
        await client.query(
          "SELECT position, id, sha256 FROM kairn_migrations.identity_release ORDER BY position",
        )
      ).rows,
      migrations,
    );
    if (applied !== migrations.length) throw new Error("Identity schema is not ready.");
    await assertIdentityStructure(client);
    if (migrations.length > 2) await assertJourneyStructure(client);
    if (migrations.length > 4) await assertFoundationStructure(client);
    if (migrations.length > 8) await assertCommandStructure(client);
    await assertIdentityPolicies(client, applied - 1);
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
