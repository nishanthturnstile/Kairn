import { randomUUID, createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { createDatabasePool, readDatabaseUrl } from "@kairn/backend/database";
import {
  checkIdentityDatabase,
  migrateIdentity,
  readIdentityMigrations,
} from "@kairn/backend/migrations";
import { provisionVerifiedAccount, runAsAccount } from "@kairn/backend/identity";

if (!process.env.TEST_IDENTITY_ISOLATED)
  throw new Error(
    "Use pnpm verify:identity; this suite requires its own disposable PostgreSQL volume.",
  );
const owner = createDatabasePool(
  readDatabaseUrl(process.env.TEST_MIGRATION_DATABASE_URL),
  "identity-migration-test",
  2,
);
const auth = createDatabasePool(
  readDatabaseUrl(process.env.TEST_AUTH_DATABASE_URL),
  "identity-auth-test",
  2,
);
const server = createDatabasePool(
  readDatabaseUrl(process.env.TEST_SERVER_DATABASE_URL),
  "identity-api-test",
  1,
);
const worker = createDatabasePool(
  readDatabaseUrl(process.env.TEST_WORKER_DATABASE_URL),
  "identity-worker-test",
  1,
);
afterAll(async () => {
  await Promise.all([owner.end(), auth.end(), server.end(), worker.end()]);
});

async function authUser(verified = true, email = `${randomUUID()}@kairn.invalid`) {
  const subject = randomUUID();
  await auth.query(
    'INSERT INTO authn."user" (id, name, email, email_verified) VALUES ($1, $2, $3, $4)',
    [subject, "Auth mirror", email, verified],
  );
  return subject;
}

describe("controlled identity migration and non-owner boundary", () => {
  it("rolls back a failed release, applies fresh schema atomically, rejects tampering and repeats safely", async () => {
    await expect(checkIdentityDatabase(server)).rejects.toThrow();
    const temporary = await mkdtemp(join(tmpdir(), "kairn-migration-failure-"));
    const migrations = await readIdentityMigrations();
    try {
      const entries = [];
      for (const [index, migration] of migrations.entries()) {
        const sql = `${migration.sql}${index === migrations.length - 1 ? "\nSELECT 1 / 0;" : ""}`;
        await writeFile(join(temporary, migration.file), sql);
        entries.push({
          file: migration.file,
          sha256: createHash("sha256").update(sql).digest("hex"),
        });
      }
      await writeFile(
        join(temporary, "manifest.json"),
        JSON.stringify({ version: 1, migrations: entries }),
      );
      await expect(migrateIdentity(owner, pathToFileURL(`${temporary}/`))).rejects.toMatchObject({
        code: "22012",
      });
      expect(
        (await owner.query("SELECT to_regclass('authn.user') AS relation")).rows[0].relation,
      ).toBeNull();
      await Promise.all([migrateIdentity(owner), migrateIdentity(owner)]);
      await migrateIdentity(owner);
      await checkIdentityDatabase(server);
      await checkIdentityDatabase(worker);
      await owner.query("GRANT SELECT ON identity.profile TO kairn_auth");
      await expect(checkIdentityDatabase(server)).rejects.toThrow("privileges");
      await owner.query("REVOKE SELECT ON identity.profile FROM kairn_auth");
      await checkIdentityDatabase(server);
      await owner.query(
        "INSERT INTO kairn_migrations.identity_release (position, id, sha256) VALUES ($1, '9999_future.sql', repeat('0', 64))",
        [migrations.length],
      );
      await expect(checkIdentityDatabase(server)).rejects.toThrow("newer");
      await expect(migrateIdentity(owner)).rejects.toThrow("newer");
      await owner.query("DELETE FROM kairn_migrations.identity_release WHERE position = $1", [
        migrations.length,
      ]);
      expect(
        (await owner.query("SELECT count(*)::int AS count FROM kairn_migrations.identity_release"))
          .rows[0].count,
      ).toBe(migrations.length);
      const original = await readFile(join(temporary, migrations[0]!.file), "utf8");
      await writeFile(join(temporary, migrations[0]!.file), `${original}\n-- unreviewed mutation`);
      await expect(migrateIdentity(owner, pathToFileURL(`${temporary}/`))).rejects.toThrow(
        "checksum",
      );
      await owner.query(
        "UPDATE kairn_migrations.identity_release SET sha256 = repeat('0', 64) WHERE position = 0",
      );
      await expect(migrateIdentity(owner)).rejects.toThrow("checksum");
      await expect(checkIdentityDatabase(server)).rejects.toThrow("checksum");
      await owner.query(
        "UPDATE kairn_migrations.identity_release SET sha256 = $1 WHERE position = 0",
        [migrations[0]!.sha256],
      );
      await owner.query("DROP POLICY profile_owner_read ON identity.profile");
      await expect(checkIdentityDatabase(server)).rejects.toThrow("policies");
      await owner.query(
        "CREATE POLICY profile_owner_read ON identity.profile FOR SELECT TO kairn_server USING (account_id IN (SELECT id FROM identity.account))",
      );
      await checkIdentityDatabase(server);
      await owner.query("ALTER POLICY profile_owner_read ON identity.profile USING (true)");
      try {
        await expect(checkIdentityDatabase(server)).rejects.toThrow("polic");
        await expect(migrateIdentity(owner)).rejects.toThrow("polic");
      } finally {
        await owner.query(
          "ALTER POLICY profile_owner_read ON identity.profile USING (account_id IN (SELECT id FROM identity.account))",
        );
      }
      await owner.query(
        "CREATE POLICY unexpected_read ON identity.profile FOR SELECT TO kairn_server USING (true)",
      );
      try {
        await expect(checkIdentityDatabase(worker)).rejects.toThrow("polic");
      } finally {
        await owner.query("DROP POLICY unexpected_read ON identity.profile");
      }
      await checkIdentityDatabase(server);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });

  it("provisions one stable account concurrently without owner privilege or existing domain context", async () => {
    const subject = await authUser();
    const actors = await Promise.all(
      Array.from({ length: 6 }, () => provisionVerifiedAccount(auth, subject, "First profile")),
    );
    expect(new Set(actors.map((actor) => actor.accountId)).size).toBe(1);
    expect(
      (
        await auth.query(
          "SELECT nullif(current_setting('kairn.verified_auth_subject', true), '') AS subject",
        )
      ).rows[0].subject,
    ).toBeNull();
    await expect(
      provisionVerifiedAccount(auth, await authUser(false), "Unverified"),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(provisionVerifiedAccount(auth, randomUUID(), "Absent")).rejects.toMatchObject({
      code: "42501",
    });
    await expect(
      server.query("SELECT * FROM identity.ensure_account($1, $2)", [subject, "Forbidden"]),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(auth.query("SELECT * FROM identity.profile")).rejects.toMatchObject({
      code: "42501",
    });
    await expect(server.query("SELECT * FROM authn.session")).rejects.toMatchObject({
      code: "42501",
    });
    for (const pool of [auth, server, worker]) {
      const role = (
        await pool.query(
          "SELECT rolsuper, rolbypassrls, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = current_user",
        )
      ).rows[0];
      expect(Object.values(role)).toEqual([false, false, false, false]);
      await expect(
        pool.query("CREATE TABLE identity.forbidden (id integer)"),
      ).rejects.toMatchObject({ code: "42501" });
    }
    await expect(server.query("SET ROLE kairn_identity")).rejects.toMatchObject({ code: "42501" });
    const account = actors[0]!;
    await runAsAccount(server, account, async (tx) => {
      await tx.execute(
        "UPDATE identity.profile SET display_name = 'Domain profile', revision = revision + 1",
      );
    });
    await provisionVerifiedAccount(auth, subject, "Changed auth mirror");
    const profile = await runAsAccount(server, account, (tx) =>
      tx.execute("SELECT display_name FROM identity.profile"),
    );
    expect(profile.rows[0]?.display_name).toBe("Domain profile");
  });

  it("isolates profiles and clears pooled account context after success and aborted SQL", async () => {
    const alice = await provisionVerifiedAccount(auth, await authUser(), "Alice private");
    const bob = await provisionVerifiedAccount(auth, await authUser(), "Bob private");
    expect((await server.query("SELECT * FROM identity.profile")).rows).toEqual([]);
    const aliceRows = await runAsAccount(server, alice, (tx) =>
      tx.execute("SELECT display_name FROM identity.profile"),
    );
    expect(aliceRows.rows.map((row) => row.display_name)).toEqual(["Alice private"]);
    const aliceUpdate = await runAsAccount(server, alice, (tx) =>
      tx.execute(
        "UPDATE identity.profile SET bio = 'Alice only', revision = revision + 1 RETURNING account_id",
      ),
    );
    expect(aliceUpdate.rows.map((row) => row.account_id)).toEqual([alice.accountId]);
    await expect(
      runAsAccount(server, alice, (tx) => tx.execute("SELECT 1 / 0")),
    ).rejects.toMatchObject({ cause: { code: "22012" } });
    expect((await server.query("SELECT * FROM identity.profile")).rows).toEqual([]);
    const bobRows = await runAsAccount(server, bob, (tx) =>
      tx.execute("SELECT display_name, bio FROM identity.profile"),
    );
    expect(bobRows.rows.map((row) => row.display_name)).toEqual(["Bob private"]);
    expect(bobRows.rows[0]?.bio).toBeNull();
    await expect(
      runAsAccount(server, bob, (tx) =>
        tx.execute("UPDATE identity.profile SET revision = revision"),
      ),
    ).rejects.toMatchObject({ cause: { code: "23514" } });
    await expect(
      server.query("SELECT auth_subject_id FROM identity.account"),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("rolls back nested work and rejects a callback that swallowed an aborted SQL transaction", async () => {
    const actor = await provisionVerifiedAccount(auth, await authUser(), "Atomic profile");
    await expect(
      runAsAccount(server, actor, async (tx) => {
        await tx.transaction(async (nested) => {
          await nested.execute(
            "UPDATE identity.profile SET bio = 'Must roll back', revision = revision + 1",
          );
        });
        throw new Error("Later command step failed.");
      }),
    ).rejects.toThrow("Later command step failed");
    const profile = await runAsAccount(server, actor, (tx) =>
      tx.execute("SELECT bio, revision FROM identity.profile"),
    );
    expect(profile.rows).toEqual([{ bio: null, revision: "1" }]);
    await expect(
      runAsAccount(server, actor, async (tx) => {
        await tx.execute("SELECT 1 / 0").catch(() => undefined);
        return "Must not report success";
      }),
    ).rejects.toMatchObject({ cause: { code: "25P02" } });
    expect((await server.query("SELECT * FROM identity.profile")).rows).toEqual([]);
  });

  it("keeps a retired auth subject denied after mapping detachment and failed live-user purge", async () => {
    const email = `${randomUUID()}@kairn.invalid`;
    const subject = await authUser(true, email);
    const actor = await provisionVerifiedAccount(auth, subject, "Retiring");
    await expect(
      auth.query('DELETE FROM authn."user" WHERE id = $1', [subject]),
    ).rejects.toMatchObject({ code: "23001" });
    await expect(
      owner.query(
        "UPDATE identity.account SET state = 'deleting', deleted_at = now(), auth_subject_id = NULL, revision = revision + 1, policy_generation = policy_generation + 1 WHERE id = $1",
        [actor.accountId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await owner.query(
      "INSERT INTO identity.retired_auth_subject (auth_subject_id, account_id, deny_generation) VALUES ($1, $2, 2)",
      [subject, actor.accountId],
    );
    await owner.query(
      "UPDATE identity.account SET state = 'deleting', deleted_at = now(), auth_subject_id = NULL, revision = revision + 1, policy_generation = policy_generation + 1 WHERE id = $1",
      [actor.accountId],
    );
    await expect(provisionVerifiedAccount(auth, subject, "Must stay denied")).rejects.toMatchObject(
      { code: "42501" },
    );
    await expect(
      runAsAccount(server, actor, (tx) => tx.execute("SELECT * FROM identity.profile")),
    ).rejects.toThrow("unavailable");
    await auth.query('DELETE FROM authn."user" WHERE id = $1', [subject]);
    const replacement = await provisionVerifiedAccount(
      auth,
      await authUser(true, email),
      "New account",
    );
    expect(replacement.accountId).not.toBe(actor.accountId);
    expect(
      (
        await owner.query(
          "SELECT count(*)::int AS count FROM identity.retired_auth_subject WHERE auth_subject_id = $1",
          [subject],
        )
      ).rows[0].count,
    ).toBe(1);
  });
});
