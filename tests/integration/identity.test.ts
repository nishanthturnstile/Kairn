import { randomUUID, createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import {
  checkDatabase,
  createDatabase,
  createDatabasePool,
  readDatabaseUrl,
} from "@kairn/backend/database";
import {
  checkIdentityDatabase,
  migrateIdentity,
  readIdentityMigrations,
} from "@kairn/backend/migrations";
import { provisionVerifiedAccount, runAsAccount } from "@kairn/backend/identity";
import {
  checkJobProducerDatabase,
  productQueues,
  startJobProducer,
} from "@kairn/backend/job-producer";
import { createJobQueue } from "@kairn/backend/queue";
import { user } from "../../packages/backend/src/identity/auth-schema.js";

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
  it("rolls back a failed release, upgrades preserved identity data atomically and rejects drift", async () => {
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
      // Preserve and upgrade an already-applied two-migration identity checkpoint.
      await writeFile(
        join(temporary, "manifest.json"),
        JSON.stringify({
          version: 1,
          migrations: migrations.slice(0, 2).map(({ file, sha256 }) => ({ file, sha256 })),
        }),
      );
      await migrateIdentity(owner, pathToFileURL(`${temporary}/`));
      const retained = await provisionVerifiedAccount(
        auth,
        await authUser(),
        "Preserved before journey migration",
      );
      await expect(checkIdentityDatabase(server)).rejects.toThrow("not ready");
      await Promise.all([migrateIdentity(owner), migrateIdentity(owner)]);
      const retainedProfile = await runAsAccount(server, retained, (tx) =>
        tx.execute("SELECT display_name FROM identity.profile"),
      );
      expect(retainedProfile.rows[0]?.display_name).toBe("Preserved before journey migration");
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

describe("enqueue-only producer on actual API/auth transactions", () => {
  const metadata = createDatabasePool(
    readDatabaseUrl(process.env.TEST_SERVER_DATABASE_URL),
    "producer-metadata-test",
    1,
  );
  const authMetadata = createDatabasePool(
    readDatabaseUrl(process.env.TEST_AUTH_DATABASE_URL),
    "auth-producer-metadata-test",
    1,
  );
  let producer: Awaited<ReturnType<typeof startJobProducer>>;
  let authProducer: Awaited<ReturnType<typeof startJobProducer>>;
  const startupErrors: string[] = [];
  beforeAll(async () => {
    const bootstrap = fileURLToPath(
      new URL("../../packages/backend/dist/bootstrap.js", import.meta.url),
    );
    await promisify(execFile)(process.execPath, [bootstrap], {
      env: { ...process.env, MIGRATION_DATABASE_URL: process.env.TEST_MIGRATION_DATABASE_URL },
    });
    await checkDatabase(server);
    await checkDatabase(worker);
    producer = await startJobProducer(metadata, () => startupErrors.push("api_metadata_error"));
    authProducer = await startJobProducer(authMetadata, () =>
      startupErrors.push("auth_metadata_error"),
    );
  });
  afterAll(async () => {
    await Promise.all([producer?.stop(), authProducer?.stop()]);
    await Promise.all([metadata.end(), authMetadata.end()]);
  });

  it("commits with real roles, deduplicates stable job IDs and survives a worker restart", async () => {
    const actor = await provisionVerifiedAccount(auth, await authUser(), "Producer profile");
    const jobs = {
      email: randomUUID(),
      restriction: randomUUID(),
      cleanup: randomUUID(),
      avatar: randomUUID(),
    };
    const stopped = createJobQueue(readDatabaseUrl(process.env.TEST_WORKER_DATABASE_URL));
    stopped.on("error", () => {});
    await stopped.start();
    await stopped.stop({ graceful: false });
    await runAsAccount(server, actor, async (tx) => {
      await tx.execute(
        "UPDATE identity.profile SET bio = 'Committed with jobs', revision = revision + 1",
      );
      for (const kind of ["email", "restriction", "cleanup", "avatar"] as const)
        expect(await producer[kind](tx, jobs[kind])).toEqual({ id: jobs[kind], inserted: true });
      expect(await producer.email(tx, jobs.email)).toEqual({ id: jobs.email, inserted: false });
    });
    const authSubject = randomUUID();
    const authEvent = randomUUID();
    await createDatabase(auth).transaction(async (tx) => {
      await tx.insert(user).values({
        id: authSubject,
        name: "Auth mail fixture",
        email: `${authSubject}@kairn.invalid`,
      });
      expect(await authProducer.email(tx, authEvent)).toEqual({ id: authEvent, inserted: true });
    });
    const consumer = createJobQueue(readDatabaseUrl(process.env.TEST_WORKER_DATABASE_URL));
    consumer.on("error", () => {});
    try {
      await consumer.start();
      for (const kind of ["email", "restriction", "cleanup", "avatar"] as const) {
        const fetched = await consumer.fetch<{ eventId: string }>(productQueues[kind], {
          batchSize: 10,
        });
        expect(fetched.map((job) => job.id).sort()).toEqual(
          (kind === "email" ? [jobs.email, authEvent] : [jobs[kind]]).sort(),
        );
        for (const job of fetched) {
          expect(job.data).toEqual({ eventId: job.id });
          await consumer.complete(productQueues[kind], job.id);
          expect((await consumer.getJobById(productQueues[kind], job.id))?.state).toBe("completed");
        }
      }
    } finally {
      await consumer.stop({ graceful: false });
    }
    expect(
      (await runAsAccount(server, actor, (tx) => tx.execute("SELECT bio FROM identity.profile")))
        .rows,
    ).toEqual([{ bio: "Committed with jobs" }]);
    expect(startupErrors).toEqual([]);
  });

  it("denies payload reads/consumption/admin and rolls back writes when enqueue lacks permission", async () => {
    const control = createJobQueue(readDatabaseUrl(process.env.TEST_MIGRATION_DATABASE_URL));
    control.on("error", () => {});
    let unapprovedTable: string;
    try {
      await control.start();
      await control.createQueue("kairn.test.unapproved", { partition: true, notify: false });
      const queue = await control.getQueue("kairn.test.unapproved");
      if (!queue?.table) throw new Error("Unapproved partition fixture is missing.");
      unapprovedTable = `pgboss."${queue.table.replaceAll('"', '""')}"`;
    } finally {
      await control.stop({ graceful: false });
    }
    const partitions = (
      await owner.query("SELECT name, table_name FROM pgboss.queue WHERE name = ANY($1::text[])", [
        Object.values(productQueues),
      ])
    ).rows;
    const emailTable = partitions.find((row) => row.name === productQueues.email)!.table_name;
    const cleanupTable = partitions.find((row) => row.name === productQueues.cleanup)!.table_name;
    const quotedEmail = `pgboss."${String(emailTable).replaceAll('"', '""')}"`;
    const quotedCleanup = `pgboss."${String(cleanupTable).replaceAll('"', '""')}"`;
    for (const pool of [server, auth]) {
      for (const statement of [
        `SELECT data FROM ${quotedEmail}`,
        "SELECT * FROM pgboss.job",
        `UPDATE ${quotedEmail} SET state = 'active' RETURNING id`,
        `UPDATE ${quotedEmail} SET state = 'completed' RETURNING id`,
        `DELETE FROM ${quotedEmail}`,
        "INSERT INTO pgboss.schedule (name) VALUES ('unapproved')",
        "SELECT pgboss.create_queue('unapproved', '{}'::jsonb)",
        "INSERT INTO pgboss.job (name) VALUES ('unapproved')",
        `INSERT INTO ${unapprovedTable} (name) VALUES ('kairn.test.unapproved')`,
      ])
        await expect(pool.query(statement)).rejects.toMatchObject({ code: "42501" });
    }
    const subject = randomUUID();
    await expect(
      createDatabase(auth).transaction(async (tx) => {
        await tx
          .insert(user)
          .values({ id: subject, name: "Must roll back", email: `${subject}@kairn.invalid` });
        await authProducer.restriction(tx, randomUUID());
      }),
    ).rejects.toMatchObject({ cause: { code: "42501" } });
    expect((await auth.query('SELECT id FROM authn."user" WHERE id = $1', [subject])).rows).toEqual(
      [],
    );

    const actor = await provisionVerifiedAccount(auth, await authUser(), "Denied enqueue");
    const event = randomUUID();
    await owner.query(`REVOKE INSERT ON ${quotedCleanup} FROM kairn_server`);
    try {
      await expect(checkDatabase(server)).rejects.toThrow("producer privileges");
      await expect(
        runAsAccount(server, actor, async (tx) => {
          await tx.execute(
            "UPDATE identity.profile SET bio = 'Must roll back', revision = revision + 1",
          );
          await producer.cleanup(tx, event);
        }),
      ).rejects.toMatchObject({ cause: { code: "42501" } });
    } finally {
      await owner.query(`GRANT INSERT ON ${quotedCleanup} TO kairn_server`);
    }
    expect(
      (
        await runAsAccount(server, actor, (tx) =>
          tx.execute("SELECT bio, revision FROM identity.profile"),
        )
      ).rows,
    ).toEqual([{ bio: null, revision: "1" }]);
    expect(
      (await owner.query(`SELECT id FROM ${quotedCleanup} WHERE id = $1`, [event])).rows,
    ).toEqual([]);
    await owner.query(`GRANT SELECT (data) ON ${quotedEmail} TO kairn_auth`);
    try {
      await expect(checkJobProducerDatabase(worker)).rejects.toThrow("producer privileges");
    } finally {
      await owner.query(`REVOKE SELECT (data) ON ${quotedEmail} FROM kairn_auth`);
    }
    await checkDatabase(worker);
  });
});

const connectMigration = () => owner.connect();

async function migrationTransaction(
  action: (client: Awaited<ReturnType<typeof connectMigration>>) => Promise<void>,
) {
  const client = await connectMigration();
  try {
    await client.query("BEGIN");
    await action(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function journeyFixture(
  actors: Awaited<ReturnType<typeof provisionVerifiedAccount>>[],
  powers: string[][],
) {
  const journeyId = randomUUID();
  const memberships = actors.map(() => randomUUID());
  await migrationTransaction(async (client) => {
    await client.query(
      `INSERT INTO journeys.journey (id, creator_account_id, title, time_zone, start_local, start_at, start_offset_minutes)
       VALUES ($1, $2, 'Private journey', 'UTC', '2026-11-03T09:00', '2026-11-03T09:00Z', 0)`,
      [journeyId, actors[0]!.accountId],
    );
    for (const [index, actor] of actors.entries()) {
      await client.query(
        "INSERT INTO journeys.membership (id, journey_id, account_id) VALUES ($1, $2, $3)",
        [memberships[index], journeyId, actor.accountId],
      );
      for (const capability of powers[index] ?? []) {
        await client.query(
          `INSERT INTO journeys.member_capability (membership_id, journey_id, membership_epoch, capability, assigned_by)
           VALUES ($1, $2, 1, $3, $4)`,
          [memberships[index], journeyId, capability, actors[0]!.accountId],
        );
      }
    }
  });
  return { journeyId, memberships };
}

async function endMembership(journeyId: string, membershipId: string, actorId: string) {
  await migrationTransaction(async (client) => {
    await client.query("SELECT id FROM journeys.journey WHERE id = $1 FOR UPDATE", [journeyId]);
    await client.query(
      "UPDATE journeys.membership SET state = 'left', ended_at = now(), end_reason = 'left', revision = revision + 1 WHERE id = $1",
      [membershipId],
    );
    await client.query(
      "UPDATE journeys.member_capability SET state = 'revoked', revoked_at = now(), revoked_by = $2, revision = revision + 1 WHERE membership_id = $1 AND state = 'active'",
      [membershipId, actorId],
    );
  });
}

describe("canonical journey and membership foundation under real roles", () => {
  it("scopes current reads, a minimal roster and former history without leaking private profiles", async () => {
    const actors = await Promise.all(
      ["Administrator", "Participant", "Coauthor", "Publisher", "Former", "Outsider"].map(
        async (name) => provisionVerifiedAccount(auth, await authUser(), name),
      ),
    );
    const [admin, participant, , , former, outsider] = actors;
    const fixture = await journeyFixture(actors.slice(0, 5), [
      ["administrator", "coauthor", "publisher"],
      [],
      ["coauthor"],
      ["publisher"],
      ["coauthor"],
    ]);
    const elsewhere = await journeyFixture([outsider!], [["administrator"]]);
    await endMembership(fixture.journeyId, fixture.memberships[4]!, admin!.accountId);
    for (const [index, actor] of actors.entries()) {
      const rows = await runAsAccount(server, actor, async (tx) => ({
        journeys: (await tx.execute("SELECT id FROM journeys.journey")).rows.map((row) => row.id),
        memberships: (await tx.execute("SELECT id FROM journeys.membership")).rows.map(
          (row) => row.id,
        ),
        capabilities: (
          await tx.execute("SELECT membership_id, state FROM journeys.member_capability")
        ).rows,
        profiles: (await tx.execute("SELECT account_id FROM identity.profile")).rows,
      }));
      expect(rows.journeys).toEqual(
        index < 4 ? [fixture.journeyId] : index === 5 ? [elsewhere.journeyId] : [],
      );
      const visible =
        index === 0
          ? fixture.memberships.slice(0, 4)
          : index < 4
            ? [fixture.memberships[0], fixture.memberships[index]]
            : [index === 4 ? fixture.memberships[4] : elsewhere.memberships[0]];
      expect(new Set(rows.memberships)).toEqual(new Set(visible));
      expect(rows.capabilities.every((row) => visible.some((id) => id === row.membership_id))).toBe(
        true,
      );
      expect(rows.profiles).toEqual([{ account_id: actor.accountId }]);
      if (actor === former)
        expect(rows.capabilities).toEqual([
          { membership_id: fixture.memberships[4], state: "revoked" },
        ]);
    }
    expect((await server.query("SELECT id FROM journeys.journey")).rows).toEqual([]);
    expect((await server.query("SELECT id FROM journeys.membership")).rows).toEqual([]);
    for (const pool of [auth, worker]) {
      await expect(pool.query("SELECT id FROM journeys.journey")).rejects.toMatchObject({
        code: "42501",
      });
    }
    for (const table of ["journey", "membership", "member_capability"]) {
      await expect(server.query(`DELETE FROM journeys.${table}`)).rejects.toMatchObject({
        code: "42501",
      });
    }
    await expect(server.query("SET ROLE kairn_journey_policy")).rejects.toMatchObject({
      code: "42501",
    });
    await expect(server.query("SELECT title FROM journeys.journey")).resolves.toMatchObject({
      rows: [],
    });
    // An account's existing rows are not authority after account restriction.
    await owner.query(
      "UPDATE identity.account SET state = 'deleting', deleted_at = now(), revision = revision + 1, policy_generation = policy_generation + 1 WHERE id = $1",
      [participant!.accountId],
    );
    await expect(
      runAsAccount(server, participant!, (tx) => tx.execute("SELECT id FROM journeys.journey")),
    ).rejects.toThrow();
    await checkIdentityDatabase(worker);
  });

  it("keeps stable membership identity, rejects old capability epochs and enforces administrator/freeze transitions", async () => {
    const admin = await provisionVerifiedAccount(auth, await authUser(), "Epoch admin");
    const member = await provisionVerifiedAccount(auth, await authUser(), "Epoch member");
    const fixture = await journeyFixture(
      [admin, member],
      [["administrator"], ["coauthor", "publisher"]],
    );
    const [adminMembership, memberMembership] = fixture.memberships;
    const other = await journeyFixture([admin], [["administrator"]]);
    await expect(
      owner.query("INSERT INTO journeys.membership (journey_id, account_id) VALUES ($1, $2)", [
        fixture.journeyId,
        member.accountId,
      ]),
    ).rejects.toMatchObject({ code: "23505" });
    await expect(
      owner.query(
        "INSERT INTO journeys.member_capability (membership_id, journey_id, membership_epoch, capability, assigned_by) VALUES ($1, $2, 2, 'coauthor', $3)",
        [memberMembership, other.journeyId, admin.accountId],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      owner.query(
        "INSERT INTO journeys.member_capability (membership_id, journey_id, membership_epoch, capability, assigned_by) VALUES ($1, $2, 1, 'administrator', $3)",
        [memberMembership, fixture.journeyId, admin.accountId],
      ),
    ).rejects.toMatchObject({ code: "23505" });
    await expect(
      endMembership(fixture.journeyId, adminMembership!, admin.accountId),
    ).rejects.toMatchObject({ code: "23514" });
    await endMembership(fixture.journeyId, memberMembership!, member.accountId);
    expect(
      (
        await owner.query(
          "SELECT epoch, previous_coauthor, previous_publisher FROM journeys.membership WHERE id = $1",
          [memberMembership],
        )
      ).rows,
    ).toEqual([{ epoch: "1", previous_coauthor: true, previous_publisher: true }]);
    await expect(
      owner.query(
        "UPDATE journeys.membership SET state = 'active', ended_at = NULL, end_reason = NULL, joined_at = now(), revision = revision + 1 WHERE id = $1",
        [memberMembership],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await owner.query(
      "UPDATE journeys.membership SET state = 'active', epoch = epoch + 1, ended_at = NULL, end_reason = NULL, joined_at = now(), revision = revision + 1 WHERE id = $1",
      [memberMembership],
    );
    await expect(
      owner.query(
        "UPDATE journeys.member_capability SET state = 'active', revoked_at = NULL, revoked_by = NULL, assigned_at = now(), revision = revision + 1 WHERE membership_id = $1",
        [memberMembership],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    const afterRejoin = await runAsAccount(server, member, (tx) =>
      tx.execute("SELECT capability, state, membership_epoch FROM journeys.member_capability"),
    );
    expect(afterRejoin.rows).toHaveLength(3); // Own two revoked powers plus the visible current administrator.
    expect(
      afterRejoin.rows
        .filter((row) => row.capability !== "administrator")
        .every((row) => row.state === "revoked" && row.membership_epoch === "1"),
    ).toBe(true);
    await owner.query(
      "INSERT INTO journeys.member_capability (membership_id, journey_id, membership_epoch, capability, assigned_by) VALUES ($1, $2, 2, 'coauthor', $3)",
      [memberMembership, fixture.journeyId, admin.accountId],
    );
    await migrationTransaction(async (client) => {
      await client.query(
        "UPDATE journeys.journey SET administration = 'frozen', revision = revision + 1, policy_generation = policy_generation + 1 WHERE id = $1",
        [fixture.journeyId],
      );
      await client.query(
        "UPDATE journeys.membership SET state = 'left', ended_at = now(), end_reason = 'left', revision = revision + 1 WHERE id = $1",
        [adminMembership],
      );
      await client.query(
        "UPDATE journeys.member_capability SET state = 'revoked', revoked_at = now(), revoked_by = $2, revision = revision + 1 WHERE membership_id = $1 AND state = 'active'",
        [adminMembership, admin.accountId],
      );
    });
    await expect(
      owner.query(
        "UPDATE journeys.journey SET administration = 'assigned', revision = revision + 1, policy_generation = policy_generation + 1 WHERE id = $1",
        [fixture.journeyId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    const permitted = await runAsAccount(server, member, (tx) =>
      tx.execute("SELECT administration FROM journeys.journey"),
    );
    expect(permitted.rows).toEqual([{ administration: "frozen" }]);
  });

  it("checks local time/instant pairs, terminal tombstones and readiness drift", async () => {
    const admin = await provisionVerifiedAccount(auth, await authUser(), "Tombstone admin");
    const fixture = await journeyFixture([admin], [["administrator"]]);
    await expect(
      owner.query(
        "UPDATE journeys.journey SET start_local = '2026-03-08T02:30', start_at = '2026-03-08T07:30Z', time_zone = 'America/New_York', start_offset_minutes = -300, revision = revision + 1 WHERE id = $1",
        [fixture.journeyId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await owner.query(
      "UPDATE journeys.journey SET start_local = '2026-11-01T01:30', start_at = '2026-11-01T06:30Z', time_zone = 'America/New_York', start_offset_minutes = -300, revision = revision + 1 WHERE id = $1",
      [fixture.journeyId],
    );
    await expect(
      owner.query(
        "UPDATE journeys.journey SET end_local = '2026-11-01T01:00', end_at = '2026-11-01T06:00Z', end_offset_minutes = -300, revision = revision + 1 WHERE id = $1",
        [fixture.journeyId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await migrationTransaction(async (client) => {
      await client.query(
        "UPDATE journeys.journey SET lifecycle = 'deleted', deleted_at = now(), title = NULL, time_zone = NULL, start_local = NULL, start_at = NULL, start_offset_minutes = NULL, revision = revision + 1, policy_generation = policy_generation + 1 WHERE id = $1",
        [fixture.journeyId],
      );
      await client.query(
        "UPDATE journeys.membership SET state = 'removed', ended_at = now(), end_reason = 'journey_deleted', revision = revision + 1 WHERE id = $1",
        [fixture.memberships[0]],
      );
      await client.query(
        "UPDATE journeys.member_capability SET state = 'revoked', revoked_at = now(), revoked_by = $2, revision = revision + 1 WHERE journey_id = $1",
        [fixture.journeyId, admin.accountId],
      );
    });
    const rows = await runAsAccount(server, admin, async (tx) => ({
      journeys: (await tx.execute("SELECT * FROM journeys.journey")).rows,
      history: (await tx.execute("SELECT journey_id, end_reason FROM journeys.membership")).rows,
    }));
    expect(rows.journeys).toEqual([]);
    expect(rows.history).toEqual([
      { journey_id: fixture.journeyId, end_reason: "journey_deleted" },
    ]);
    await expect(
      owner.query(
        "UPDATE journeys.journey SET lifecycle = 'active', deleted_at = NULL, revision = revision + 1, policy_generation = policy_generation + 1 WHERE id = $1",
        [fixture.journeyId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await owner.query("ALTER TABLE journeys.membership DISABLE TRIGGER membership_graph");
    try {
      await expect(checkIdentityDatabase(server)).rejects.toThrow("integrity guards");
    } finally {
      await owner.query("ALTER TABLE journeys.membership ENABLE TRIGGER membership_graph");
    }
    await owner.query("ALTER POLICY journey_current_read ON journeys.journey USING (true)");
    try {
      await expect(checkIdentityDatabase(worker)).rejects.toThrow("policies");
    } finally {
      await owner.query(
        "ALTER POLICY journey_current_read ON journeys.journey USING (journeys.actor_can_read_journey(id))",
      );
    }
    await owner.query("GRANT SELECT (title) ON journeys.journey TO kairn_journey_policy");
    try {
      await expect(checkIdentityDatabase(server)).rejects.toThrow("privileges");
    } finally {
      await owner.query("REVOKE SELECT (title) ON journeys.journey FROM kairn_journey_policy");
    }
    await checkIdentityDatabase(server);
  });
});
