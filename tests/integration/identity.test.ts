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
      await writeFile(
        join(temporary, "manifest.json"),
        JSON.stringify({
          version: 1,
          migrations: migrations.slice(0, 4).map(({ file, sha256 }) => ({ file, sha256 })),
        }),
      );
      await migrateIdentity(owner, pathToFileURL(`${temporary}/`));
      const retainedJourney = await journeyFixture([retained], [["administrator"]]);
      await writeFile(
        join(temporary, "manifest.json"),
        JSON.stringify({ version: 1, migrations: entries }),
      );
      await expect(migrateIdentity(owner, pathToFileURL(`${temporary}/`))).rejects.toMatchObject({
        code: "22012",
      });
      expect(
        (await owner.query("SELECT count(*)::int AS count FROM kairn_migrations.identity_release"))
          .rows[0].count,
      ).toBe(4);
      expect(
        (await owner.query("SELECT to_regclass('sources.source') AS relation")).rows[0].relation,
      ).toBeNull();

      await expect(checkIdentityDatabase(server)).rejects.toThrow("not ready");
      await Promise.all([migrateIdentity(owner), migrateIdentity(owner)]);
      expect(
        (
          await runAsAccount(server, retained, (tx) =>
            tx.execute("SELECT id FROM journeys.journey"),
          )
        ).rows,
      ).toEqual([{ id: retainedJourney.journeyId }]);
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
      "UPDATE journeys.membership SET state = 'left', ended_at = GREATEST(clock_timestamp(), joined_at), end_reason = 'left', revision = revision + 1 WHERE id = $1",
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
        "UPDATE journeys.membership SET state = 'left', ended_at = GREATEST(clock_timestamp(), joined_at), end_reason = 'left', revision = revision + 1 WHERE id = $1",
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
        "UPDATE journeys.membership SET state = 'removed', ended_at = GREATEST(clock_timestamp(), joined_at), end_reason = 'journey_deleted', revision = revision + 1 WHERE id = $1",
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

async function actorFixture(name: string) {
  return provisionVerifiedAccount(auth, await authUser(), name);
}
async function guardFixture(journeyId: string, accountId: string) {
  const id = randomUUID();
  await owner.query(
    "INSERT INTO journeys.recipient_guard (id, journey_id, recipient_key, recipient_email, bound_account_id) VALUES ($1, $2, $3, $4, $5)",
    [
      id,
      journeyId,
      createHash("sha256").update(id).digest("hex"),
      `${id}@kairn.invalid`,
      accountId,
    ],
  );
  return id;
}
async function invitationFixture(
  journeyId: string,
  guardId: string,
  inviterMembershipId: string,
  inviterAccountId: string,
) {
  const id = randomUUID();
  await owner.query(
    `INSERT INTO journeys.invitation (id, journey_id, guard_id, admission_epoch, inviter_membership_id, inviter_account_id, inviter_membership_epoch, secret_hash, offered_coauthor, expires_at)
    SELECT $1, $2, g.id, g.admission_epoch, m.id, $4, m.epoch, $5, true, now() + interval '7 days'
    FROM journeys.recipient_guard AS g CROSS JOIN journeys.membership AS m WHERE g.id = $3 AND m.id = $6`,
    [
      id,
      journeyId,
      guardId,
      inviterAccountId,
      createHash("sha256").update(id).digest("hex"),
      inviterMembershipId,
    ],
  );
  return id;
}

describe("remaining B02 admission, transfer and identity-media invariants", () => {
  it("invalidates both old offers on departure, serializes pending offers and binds an intentional rejoin", async () => {
    const [admin, recipient, other] = await Promise.all([
      actorFixture("Admission admin"),
      actorFixture("Admission recipient"),
      actorFixture("Unrelated recipient"),
    ]);
    const j = await journeyFixture([admin!, recipient!], [["administrator"], []]);
    const guard = await guardFixture(j.journeyId, recipient!.accountId);
    const first = await invitationFixture(j.journeyId, guard, j.memberships[0]!, admin!.accountId);
    await owner.query(
      "UPDATE journeys.recipient_guard SET admission_epoch = admission_epoch + 1, revision = revision + 1 WHERE id = $1",
      [guard],
    );
    const second = await invitationFixture(j.journeyId, guard, j.memberships[0]!, admin!.accountId);
    await endMembership(j.journeyId, j.memberships[1]!, recipient!.accountId);
    expect(
      (await owner.query("SELECT state FROM journeys.invitation WHERE id = $1", [first])).rows[0]
        .state,
    ).toBe("superseded");
    expect(
      (await owner.query("SELECT state FROM journeys.invitation WHERE id = $1", [second])).rows[0]
        .state,
    ).toBe("revoked");
    await expect(
      owner.query(
        "UPDATE journeys.invitation SET state = 'pending', closed_at = NULL, revision = revision + 1 WHERE id = $1",
        [second],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      owner.query(
        "UPDATE journeys.recipient_guard SET bound_account_id = $2, revision = revision + 1 WHERE id = $1",
        [guard, other!.accountId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    const reissued = await invitationFixture(
      j.journeyId,
      guard,
      j.memberships[0]!,
      admin!.accountId,
    );
    await migrationTransaction(async (client) => {
      await client.query("SELECT id FROM journeys.journey WHERE id = $1 FOR UPDATE", [j.journeyId]);
      await client.query(
        "UPDATE journeys.membership SET state = 'active', epoch = epoch + 1, joined_at = GREATEST(clock_timestamp(), ended_at), ended_at = NULL, end_reason = NULL, revision = revision + 1 WHERE id = $1",
        [j.memberships[1]],
      );
      await client.query(
        "UPDATE journeys.invitation SET state = 'accepted', closed_at = clock_timestamp(), accepted_account_id = $2, accepted_membership_id = $3, accepted_membership_epoch = 2, revision = revision + 1 WHERE id = $1",
        [reissued, recipient!.accountId, j.memberships[1]],
      );
      await client.query(
        "INSERT INTO journeys.member_capability (membership_id, journey_id, membership_epoch, capability, assigned_by) VALUES ($1, $2, 2, 'coauthor', $3)",
        [j.memberships[1], j.journeyId, admin!.accountId],
      );
    });
    const raceGuard = await guardFixture(j.journeyId, other!.accountId);
    const competing = await Promise.allSettled([
      invitationFixture(j.journeyId, raceGuard, j.memberships[0]!, admin!.accountId),
      invitationFixture(j.journeyId, raceGuard, j.memberships[0]!, admin!.accountId),
    ]);
    expect(competing.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(competing.find((result) => result.status === "rejected")?.reason).toMatchObject({
      code: "23505",
    });
    const recipientRows = await runAsAccount(server, recipient!, (tx) =>
      tx.execute("SELECT id FROM journeys.invitation"),
    );
    expect(new Set(recipientRows.rows.map((row) => row.id))).toEqual(
      new Set([first, second, reissued]),
    );
    await expect(server.query("SELECT secret_hash FROM journeys.invitation")).rejects.toMatchObject(
      { code: "42501" },
    );
    await expect(
      server.query("SELECT recipient_email, recipient_key FROM journeys.recipient_guard"),
    ).rejects.toMatchObject({ code: "42501" });
    await restrictionOperationFixture(
      admin!.accountId,
      "invitation.revoke",
      "invitation.revoke",
      "invitation",
      second,
      j.journeyId,
    );
    const outsider = await actorFixture("Admission outsider");
    expect(
      (
        await runAsAccount(server, outsider, (tx) =>
          tx.execute("SELECT id FROM journeys.invitation"),
        )
      ).rows,
    ).toEqual([]);
  });

  it("moves only administration atomically and permits a fresh archive-aware continuity offer", async () => {
    const [admin, target, publisher] = await Promise.all([
      actorFixture("Transfer admin"),
      actorFixture("Transfer coauthor"),
      actorFixture("Transfer publisher"),
    ]);
    const j = await journeyFixture(
      [admin!, target!, publisher!],
      [["administrator", "coauthor", "publisher"], ["coauthor"], ["publisher"]],
    );
    async function offer(from: number, to: number, generation: number) {
      const id = randomUUID();
      await owner.query(
        `INSERT INTO journeys.administration_transfer (id, journey_id, offering_membership_id, offering_account_id, offering_epoch, target_membership_id, target_account_id, target_epoch, journey_policy_generation, expires_at)
        VALUES ($1, $2, $3, $4, 1, $5, $6, 1, $7, now() + interval '72 hours')`,
        [
          id,
          j.journeyId,
          j.memberships[from],
          [admin, target, publisher][from]!.accountId,
          j.memberships[to],
          [admin, target, publisher][to]!.accountId,
          generation,
        ],
      );
      return id;
    }
    await expect(offer(0, 2, 1)).rejects.toMatchObject({ code: "23514" });
    const first = await offer(0, 1, 1);
    await expect(offer(0, 1, 1)).rejects.toMatchObject({ code: "23505" });
    await expect(
      owner.query(
        "UPDATE journeys.administration_transfer SET state = 'accepted', closed_at = clock_timestamp(), revision = revision + 1 WHERE id = $1",
        [first],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    async function accept(id: string, from: number, to: number) {
      await migrationTransaction(async (client) => {
        await client.query("SELECT id FROM journeys.journey WHERE id = $1 FOR UPDATE", [
          j.journeyId,
        ]);
        await client.query(
          "UPDATE journeys.administration_transfer SET state = 'accepted', closed_at = clock_timestamp(), revision = revision + 1 WHERE id = $1",
          [id],
        );
        await client.query(
          "UPDATE journeys.member_capability SET state = 'revoked', revoked_at = clock_timestamp(), revoked_by = $2, revision = revision + 1 WHERE membership_id = $1 AND capability = 'administrator' AND state = 'active'",
          [j.memberships[from], [admin, target][to]!.accountId],
        );
        await client.query(
          `INSERT INTO journeys.member_capability (membership_id, journey_id, membership_epoch, capability, assigned_by) VALUES ($1, $2, 1, 'administrator', $3)
          ON CONFLICT (membership_id, membership_epoch, capability) DO UPDATE SET state = 'active', revoked_at = NULL, revoked_by = NULL, assigned_at = clock_timestamp(), assigned_by = EXCLUDED.assigned_by, revision = journeys.member_capability.revision + 1`,
          [j.memberships[to], j.journeyId, [admin, target][from]!.accountId],
        );
        await client.query(
          "UPDATE journeys.journey SET policy_generation = policy_generation + 1, revision = revision + 1 WHERE id = $1",
          [j.journeyId],
        );
      });
    }
    await accept(first, 0, 1);
    expect(
      (
        await owner.query(
          "SELECT capability FROM journeys.member_capability WHERE membership_id = $1 AND state = 'active' ORDER BY capability",
          [j.memberships[0]],
        )
      ).rows,
    ).toEqual([{ capability: "coauthor" }, { capability: "publisher" }]);
    await owner.query(
      "UPDATE journeys.journey SET lifecycle = 'archived', policy_generation = policy_generation + 1, revision = revision + 1 WHERE id = $1",
      [j.journeyId],
    );
    const archivedOffer = await offer(1, 0, 3);
    await accept(archivedOffer, 1, 0);
    expect(
      (await owner.query("SELECT lifecycle FROM journeys.journey WHERE id = $1", [j.journeyId]))
        .rows[0].lifecycle,
    ).toBe("archived");
    expect(
      (
        await owner.query(
          "SELECT capability FROM journeys.member_capability WHERE membership_id = $1 AND state = 'active' ORDER BY capability",
          [j.memberships[1]],
        )
      ).rows,
    ).toEqual([{ capability: "coauthor" }]);
  });

  it("keeps avatar selection owner-bound, sanitized and independent of source assets", async () => {
    const [alice, bob] = await Promise.all([
      actorFixture("Avatar Alice"),
      actorFixture("Avatar Bob"),
    ]);
    async function avatar(state: string) {
      const id = randomUUID();
      await owner.query(
        `INSERT INTO identity.profile_avatar (id, owner_account_id, state, quarantine_bucket, quarantine_key, input_content_type, input_bytes, input_sha256, representation_bucket, representation_key, representation_content_type, representation_bytes, representation_sha256, width, height, verified_input_width, verified_input_height, upload_expires_at)
        VALUES ($1::uuid, $2::uuid, $3::text, 'private-quarantine', $1::text, 'image/png', 1024, repeat('a',64), CASE WHEN $3 = 'available' THEN 'private-avatar' END, CASE WHEN $3 = 'available' THEN $1::text END, CASE WHEN $3 = 'available' THEN 'image/png' END, CASE WHEN $3 = 'available' THEN 256 END, CASE WHEN $3 = 'available' THEN repeat('b',64) END, CASE WHEN $3 = 'available' THEN 128 END, CASE WHEN $3 = 'available' THEN 128 END, CASE WHEN $3 = 'available' THEN 128 END, CASE WHEN $3 = 'available' THEN 128 END, now() + interval '24 hours')`,
        [id, alice!.accountId, state],
      );
      return id;
    }
    const available = await avatar("available");
    await owner.query(
      "UPDATE identity.profile SET avatar_id = $2, revision = revision + 1 WHERE account_id = $1",
      [alice!.accountId, available],
    );
    await expect(
      owner.query(
        "UPDATE identity.profile SET avatar_id = $2, revision = revision + 1 WHERE account_id = $1",
        [bob!.accountId, available],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    const pending = await avatar("pending");
    await expect(
      owner.query(
        "UPDATE identity.profile_avatar SET verified_input_width = 4000, verified_input_height = 4000, revision = revision + 1 WHERE id = $1",
        [pending],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(avatar("pending")).rejects.toMatchObject({ code: "23505" });
    await expect(
      owner.query(
        "UPDATE identity.profile SET avatar_id = $2, revision = revision + 1 WHERE account_id = $1",
        [alice!.accountId, pending],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    expect(
      (
        await runAsAccount(server, bob!, (tx) =>
          tx.execute("SELECT id FROM identity.profile_avatar"),
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await runAsAccount(server, alice!, (tx) =>
          tx.execute("SELECT id FROM identity.profile_avatar"),
        )
      ).rows,
    ).toHaveLength(2);
    await expect(
      server.query("SELECT quarantine_key FROM identity.profile_avatar"),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      server.query("SELECT representation_key FROM identity.profile_avatar"),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      owner.query("DELETE FROM identity.account WHERE id = $1", [alice!.accountId]),
    ).rejects.toMatchObject({ code: "23001" });
    await checkIdentityDatabase(worker);
  });
});

async function sourceFixture(journeyId: string, ownerAccountId: string, count = 2) {
  const items = Array.from({ length: count }, () => ({
    sourceId: randomUUID(),
    assetId: randomUUID(),
    sourceGrantId: randomUUID(),
  }));
  await migrationTransaction(async (client) => {
    for (const item of items) {
      await client.query(
        "INSERT INTO sources.source (id, owner_account_id, kind, provenance) VALUES ($1, $2, 'photo', 'native_capture')",
        [item.sourceId, ownerAccountId],
      );
      await client.query(
        "INSERT INTO sources.source_asset (id, source_id, owner_account_id, kind, state, verified_bytes, verified_sha256, content_type) VALUES ($1, $2, $3, 'image', 'verified', 1024, repeat('a',64), 'image/jpeg')",
        [item.assetId, item.sourceId, ownerAccountId],
      );
      await client.query(
        "INSERT INTO sources.source_grant (id, source_id, owner_account_id, journey_id, scope, state, changed_by) VALUES ($1, $2, $3, $4, 'journey_review', 'active', $3)",
        [item.sourceGrantId, item.sourceId, ownerAccountId, journeyId],
      );
    }
  });
  return items;
}
async function exportFixture(
  journeyId: string,
  ownerAccountId: string,
  requester: Awaited<ReturnType<typeof actorFixture>>,
  membershipId: string,
  items: Awaited<ReturnType<typeof sourceFixture>>,
  epoch = 1,
) {
  const requestId = randomUUID();
  const grantId = randomUUID();
  await migrationTransaction(async (client) => {
    await client.query(
      "INSERT INTO sources.export_request (id, owner_account_id, journey_id, requester_account_id, requester_membership_id, requester_epoch, expires_at) VALUES ($1, $2, $3, $4, $5, $6, now() + interval '7 days')",
      [requestId, ownerAccountId, journeyId, requester.accountId, membershipId, epoch],
    );
    for (const item of items)
      await client.query(
        "INSERT INTO sources.export_request_asset (request_id, asset_id, source_id, owner_account_id, journey_id, source_grant_id, asset_revision, source_grant_revision) VALUES ($1, $2, $3, $4, $5, $6, 1, 1)",
        [requestId, item.assetId, item.sourceId, ownerAccountId, journeyId, item.sourceGrantId],
      );
    await client.query(
      "UPDATE sources.export_request SET state = 'approved', closed_at = clock_timestamp(), revision = revision + 1 WHERE id = $1",
      [requestId],
    );
    await client.query(
      "INSERT INTO sources.export_grant (id, request_id, owner_account_id, journey_id, recipient_account_id, recipient_membership_id, recipient_epoch, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now() + interval '24 hours')",
      [grantId, requestId, ownerAccountId, journeyId, requester.accountId, membershipId, epoch],
    );
    for (const item of items)
      await client.query(
        "INSERT INTO sources.export_grant_asset (grant_id, request_id, asset_id, source_id, owner_account_id, journey_id, source_grant_id, asset_revision, source_grant_revision) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 1)",
        [
          grantId,
          requestId,
          item.assetId,
          item.sourceId,
          ownerAccountId,
          journeyId,
          item.sourceGrantId,
        ],
      );
  });
  return { requestId, grantId };
}
async function exportAllowed(
  actor: Awaited<ReturnType<typeof actorFixture>>,
  assetId: string,
  grantId: string,
) {
  // All interpolated IDs are generated by randomUUID in these isolated fixtures.
  return (
    await runAsAccount(server, actor, (tx) =>
      tx.execute(`SELECT sources.actor_can_export_asset('${assetId}', '${grantId}') AS allowed`),
    )
  ).rows[0]?.allowed;
}

describe("B02 source ownership and exact original-export relationships", () => {
  it("isolates owner/reviewer/participant access and rejects stale per-source revisions and membership epochs", async () => {
    const actors = await Promise.all(
      [
        "Admin only",
        "Source owner",
        "Review coauthor",
        "Review publisher",
        "Export recipient",
        "Source outsider",
      ].map(actorFixture),
    );
    const [admin, sourceOwner, coauthor, publisher, recipient, outsider] = actors;
    const j = await journeyFixture(actors.slice(0, 5), [
      ["administrator"],
      [],
      ["coauthor"],
      ["publisher"],
      [],
    ]);
    const items = await sourceFixture(j.journeyId, sourceOwner!.accountId);
    const privateSource = randomUUID();
    await owner.query(
      "INSERT INTO sources.source (id, owner_account_id, kind, provenance) VALUES ($1, $2, 'note', 'native_capture')",
      [privateSource, sourceOwner!.accountId],
    );
    for (const actor of actors) {
      const rows = await runAsAccount(server, actor, (tx) =>
        tx.execute("SELECT id FROM sources.source"),
      );
      const expected =
        actor === sourceOwner
          ? [...items.map((item) => item.sourceId), privateSource]
          : actor === coauthor || actor === publisher
            ? items.map((item) => item.sourceId)
            : [];
      expect(new Set(rows.rows.map((row) => row.id))).toEqual(new Set(expected));
    }
    const exported = await exportFixture(
      j.journeyId,
      sourceOwner!.accountId,
      recipient!,
      j.memberships[4]!,
      items,
    );
    expect(await exportAllowed(recipient!, items[0]!.assetId, exported.grantId)).toBe(true);
    expect(await exportAllowed(admin!, items[0]!.assetId, exported.grantId)).toBe(false);
    expect(await exportAllowed(outsider!, items[0]!.assetId, exported.grantId)).toBe(false);
    // Mutable current revisions are not FK targets: withdrawal must remain possible.
    await owner.query(
      "UPDATE sources.source_grant SET scope = 'only_me', state = 'withdrawn', revision = revision + 1, changed_at = clock_timestamp() WHERE id = $1",
      [items[0]!.sourceGrantId],
    );
    expect(await exportAllowed(recipient!, items[0]!.assetId, exported.grantId)).toBe(false);
    expect(await exportAllowed(recipient!, items[1]!.assetId, exported.grantId)).toBe(true);
    await endMembership(j.journeyId, j.memberships[4]!, recipient!.accountId);
    await owner.query(
      "UPDATE journeys.membership SET state = 'active', epoch = epoch + 1, joined_at = GREATEST(clock_timestamp(), ended_at), ended_at = NULL, end_reason = NULL, revision = revision + 1 WHERE id = $1",
      [j.memberships[4]],
    );
    expect(await exportAllowed(recipient!, items[1]!.assetId, exported.grantId)).toBe(false);
    const fresh = await exportFixture(
      j.journeyId,
      sourceOwner!.accountId,
      recipient!,
      j.memberships[4]!,
      [items[1]!],
      2,
    );
    expect(await exportAllowed(recipient!, items[1]!.assetId, fresh.grantId)).toBe(true);
    await owner.query(
      "UPDATE identity.account SET state = 'deleting', deleted_at = clock_timestamp(), revision = revision + 1, policy_generation = policy_generation + 1 WHERE id = $1",
      [sourceOwner!.accountId],
    );
    expect(await exportAllowed(recipient!, items[1]!.assetId, fresh.grantId)).toBe(false);
    expect(
      (await runAsAccount(server, coauthor!, (tx) => tx.execute("SELECT id FROM sources.source")))
        .rows,
    ).toEqual([]);
    for (const pool of [auth, worker])
      await expect(pool.query("SELECT id FROM sources.source")).rejects.toMatchObject({
        code: "42501",
      });
  });

  it("rejects cross-owner/journey/asset bindings, empty requests and unapproved snapshots", async () => {
    const [admin, sourceOwner, recipient] = await Promise.all([
      actorFixture("Binding admin"),
      actorFixture("Binding owner"),
      actorFixture("Binding recipient"),
    ]);
    const j = await journeyFixture([admin!, sourceOwner!, recipient!], [["administrator"], [], []]);
    const other = await journeyFixture([admin!], [["administrator"]]);
    const items = await sourceFixture(j.journeyId, sourceOwner!.accountId, 1);
    const item = items[0]!;
    await expect(
      owner.query(
        "INSERT INTO sources.source_asset (source_id, owner_account_id, kind) VALUES ($1, $2, 'image')",
        [item.sourceId, recipient!.accountId],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      owner.query(
        "INSERT INTO sources.export_request (owner_account_id, journey_id, requester_account_id, requester_membership_id, requester_epoch, expires_at) VALUES ($1, $2, $3, $4, 1, now() + interval '1 day')",
        [sourceOwner!.accountId, j.journeyId, recipient!.accountId, j.memberships[2]],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      migrationTransaction(async (client) => {
        const requestId = randomUUID();
        await client.query(
          "INSERT INTO sources.export_request (id, owner_account_id, journey_id, requester_account_id, requester_membership_id, requester_epoch, expires_at) VALUES ($1, $2, $3, $4, $5, 1, now() + interval '1 day')",
          [requestId, sourceOwner!.accountId, j.journeyId, recipient!.accountId, j.memberships[2]],
        );
        await client.query(
          "INSERT INTO sources.export_request_asset (request_id, asset_id, source_id, owner_account_id, journey_id, source_grant_id, asset_revision, source_grant_revision) VALUES ($1, $2, $3, $4, $5, $6, 1, 1)",
          [
            requestId,
            item.assetId,
            item.sourceId,
            sourceOwner!.accountId,
            other.journeyId,
            item.sourceGrantId,
          ],
        );
      }),
    ).rejects.toMatchObject({ code: "23503" });
    const granted = await exportFixture(
      j.journeyId,
      sourceOwner!.accountId,
      recipient!,
      j.memberships[2]!,
      items,
    );
    const sourceOperation = await restrictionOperationFixture(
      sourceOwner!.accountId,
      "source_grant.withdraw",
      "source.withdraw",
      "source_grant",
      item.sourceGrantId,
      j.journeyId,
    );
    await restrictionOperationFixture(
      sourceOwner!.accountId,
      "export.revoke",
      "export.revoke",
      "export_grant",
      granted.grantId,
      j.journeyId,
    );
    await expect(
      restrictionOperationFixture(
        sourceOwner!.accountId,
        "source_grant.withdraw",
        "source.withdraw",
        "journey",
        j.journeyId,
        j.journeyId,
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      restrictionOperationFixture(
        recipient!.accountId,
        "source_grant.withdraw",
        "source.withdraw",
        "source_grant",
        item.sourceGrantId,
        j.journeyId,
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      owner.query(
        "UPDATE operations.lifecycle_operation SET resource_id = $2, revision = revision + 1 WHERE id = $1",
        [sourceOperation, randomUUID()],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      owner.query(
        "UPDATE sources.export_grant_asset SET source_grant_revision = 2 WHERE grant_id = $1",
        [granted.grantId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      owner.query(
        "UPDATE sources.source SET owner_account_id = $2, revision = revision + 1 WHERE id = $1",
        [item.sourceId, recipient!.accountId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      migrationTransaction(async (client) => {
        const requestId = randomUUID();
        const grantId = randomUUID();
        await client.query(
          "INSERT INTO sources.export_request (id, owner_account_id, journey_id, requester_account_id, requester_membership_id, requester_epoch, expires_at) VALUES ($1, $2, $3, $4, $5, 1, now() + interval '1 day')",
          [requestId, sourceOwner!.accountId, j.journeyId, recipient!.accountId, j.memberships[2]],
        );
        await client.query(
          "INSERT INTO sources.export_request_asset (request_id, asset_id, source_id, owner_account_id, journey_id, source_grant_id, asset_revision, source_grant_revision) VALUES ($1, $2, $3, $4, $5, $6, 1, 1)",
          [
            requestId,
            item.assetId,
            item.sourceId,
            sourceOwner!.accountId,
            j.journeyId,
            item.sourceGrantId,
          ],
        );
        await client.query(
          "UPDATE sources.source_grant SET scope = 'publication_reuse', revision = revision + 1, changed_at = clock_timestamp() WHERE id = $1",
          [item.sourceGrantId],
        );
        await client.query(
          "UPDATE sources.export_request SET state = 'approved', closed_at = clock_timestamp(), revision = revision + 1 WHERE id = $1",
          [requestId],
        );
        await client.query(
          "INSERT INTO sources.export_grant (id, request_id, owner_account_id, journey_id, recipient_account_id, recipient_membership_id, recipient_epoch, expires_at) VALUES ($1, $2, $3, $4, $5, $6, 1, now() + interval '1 day')",
          [
            grantId,
            requestId,
            sourceOwner!.accountId,
            j.journeyId,
            recipient!.accountId,
            j.memberships[2],
          ],
        );
        await client.query(
          "INSERT INTO sources.export_grant_asset (grant_id, request_id, asset_id, source_id, owner_account_id, journey_id, source_grant_id, asset_revision, source_grant_revision) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 2)",
          [
            grantId,
            requestId,
            item.assetId,
            item.sourceId,
            sourceOwner!.accountId,
            j.journeyId,
            item.sourceGrantId,
          ],
        );
      }),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      migrationTransaction(async (client) => {
        const requestId = randomUUID();
        await client.query(
          "INSERT INTO sources.export_request (id, owner_account_id, journey_id, requester_account_id, requester_membership_id, requester_epoch, expires_at) VALUES ($1, $2, $3, $4, $5, 1, now() + interval '1 day')",
          [requestId, sourceOwner!.accountId, j.journeyId, recipient!.accountId, j.memberships[2]],
        );
        const extraAssets = (
          await client.query(
            "INSERT INTO sources.source_asset (source_id, owner_account_id, kind, state, verified_bytes, verified_sha256, content_type) SELECT $1, $2, 'image', 'verified', 1024, repeat('a',64), 'image/jpeg' FROM generate_series(1,101) RETURNING id",
            [item.sourceId, sourceOwner!.accountId],
          )
        ).rows.map((row) => row.id);
        await client.query(
          "INSERT INTO sources.export_request_asset (request_id, asset_id, source_id, owner_account_id, journey_id, source_grant_id, asset_revision, source_grant_revision) SELECT $1, unnest($2::uuid[]), $3, $4, $5, $6, 1, 1",
          [
            requestId,
            extraAssets,
            item.sourceId,
            sourceOwner!.accountId,
            j.journeyId,
            item.sourceGrantId,
          ],
        );
      }),
    ).rejects.toMatchObject({ code: "23514" });
    await owner.query("UPDATE sources.source_asset SET revision = revision + 1 WHERE id = $1", [
      item.assetId,
    ]);
    expect(await exportAllowed(recipient!, item.assetId, granted.grantId)).toBe(false);
    await owner.query("ALTER POLICY source_scoped_read ON sources.source USING (true)");
    try {
      await expect(checkIdentityDatabase(worker)).rejects.toThrow("policies");
    } finally {
      await owner.query(
        "ALTER POLICY source_scoped_read ON sources.source USING (sources.actor_can_read_source(id))",
      );
    }
    await owner.query("ALTER TABLE sources.source_grant DISABLE TRIGGER source_grant_transition");
    try {
      await expect(checkIdentityDatabase(server)).rejects.toThrow("integrity guards");
    } finally {
      await owner.query("ALTER TABLE sources.source_grant ENABLE TRIGGER source_grant_transition");
    }
    await owner.query("GRANT SELECT (secret_hash) ON journeys.invitation TO kairn_access_policy");
    try {
      await expect(checkIdentityDatabase(server)).rejects.toThrow("privileges");
    } finally {
      await owner.query(
        "REVOKE SELECT (secret_hash) ON journeys.invitation FROM kairn_access_policy",
      );
    }
    await checkIdentityDatabase(server);
  });
});

async function restrictionOperationFixture(
  actorAccountId: string,
  operationType: string,
  action: string,
  resourceKind: string,
  resourceId: string,
  journeyId: string,
) {
  const commandId = await commandFixture(actorAccountId, operationType);
  const id = randomUUID();
  await owner.query(
    "INSERT INTO operations.lifecycle_operation (id, actor_account_id, command_id, action, resource_kind, resource_id, journey_id, impact_digest, target_revision, policy_generation) VALUES ($1, $2, $3, $4, $5, $6, $7, repeat('a',64), 1, 1)",
    [id, actorAccountId, commandId, action, resourceKind, resourceId, journeyId],
  );
  return id;
}

async function commandFixture(actorAccountId: string, operationType = "account.delete") {
  const commandId = randomUUID();
  await owner.query(
    "INSERT INTO operations.command_receipt (actor_account_id, command_id, operation_type, payload_digest, result_state, expires_at) VALUES ($1, $2, $3, repeat('a',64), 'restriction_pending', now() + interval '30 days')",
    [actorAccountId, commandId, operationType],
  );
  return commandId;
}

describe("B02 command, event, delivery and cursor foundations", () => {
  it("retains command barriers, isolates metadata and requires matching receipts without equating purge with confirmation", async () => {
    const [alice, bob] = await Promise.all([
      actorFixture("Operation Alice"),
      actorFixture("Operation Bob"),
    ]);
    const commandId = await commandFixture(alice!.accountId);
    await expect(
      owner.query(
        "INSERT INTO operations.command_receipt (actor_account_id, command_id, operation_type, payload_digest, result_state, expires_at) VALUES ($1, $2, 'account.delete', repeat('b',64), 'accepted', now() + interval '30 days')",
        [alice!.accountId, commandId],
      ),
    ).rejects.toMatchObject({ code: "23505" });
    await expect(
      owner.query(
        "UPDATE operations.command_receipt SET payload_digest = repeat('b',64) WHERE actor_account_id = $1 AND command_id = $2",
        [alice!.accountId, commandId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      owner.query(
        "INSERT INTO operations.audit_event (actor_kind, action, target_id, revision, policy_generation) VALUES ('operator', 'operator.inspect', $1, 1, 1)",
        [alice!.accountId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    const expiredCommand = randomUUID();
    await owner.query(
      "INSERT INTO operations.command_receipt (actor_account_id, command_id, operation_type, payload_digest, result_state, resource_kind, resource_id, created_at, expires_at) VALUES ($1, $2, 'profile.update', repeat('a',64), 'accepted', 'profile', $1, now() - interval '31 days', now() - interval '1 day')",
      [alice!.accountId, expiredCommand],
    );
    await owner.query(
      "UPDATE operations.command_receipt SET retention_state = 'redacted', resource_kind = NULL, resource_id = NULL WHERE actor_account_id = $1 AND command_id = $2",
      [alice!.accountId, expiredCommand],
    );
    await expect(
      owner.query(
        "UPDATE operations.command_receipt SET retention_state = 'live' WHERE actor_account_id = $1 AND command_id = $2",
        [alice!.accountId, expiredCommand],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    const operationId = randomUUID();
    const eventId = randomUUID();
    const auditId = randomUUID();
    const noticeId = randomUUID();
    await migrationTransaction(async (client) => {
      await client.query(
        "INSERT INTO operations.lifecycle_operation (id, actor_account_id, command_id, action, resource_kind, resource_id, target_account_id, impact_digest, target_revision, policy_generation, status_receipt_hash, receipt_hard_expires_at) VALUES ($1, $2, $3, 'delete_account', 'account', $2, $2, repeat('b',64), 1, 1, repeat('c',64), now() + interval '45 days')",
        [operationId, alice!.accountId, commandId],
      );
      await client.query(
        "INSERT INTO operations.restriction_event (id, operation_id, kind, account_id, policy_generation, integrity_sha256) VALUES ($1, $2, 'account.delete', $3, 1, repeat('d',64))",
        [eventId, operationId, alice!.accountId],
      );
      await client.query("INSERT INTO operations.restriction_delivery (event_id) VALUES ($1)", [
        eventId,
      ]);
      await client.query(
        "INSERT INTO operations.audit_event (id, actor_kind, actor_account_id, command_id, action, subject_account_id, target_id, revision, policy_generation) VALUES ($1, 'account', $2, $3, 'account.delete', $2, $2, 1, 1)",
        [auditId, alice!.accountId, commandId],
      );
      await client.query(
        "INSERT INTO operations.account_notice (id, recipient_account_id, event_id, kind) VALUES ($1, $2, $3, 'lifecycle')",
        [noticeId, alice!.accountId, auditId],
      );
      await client.query(
        "INSERT INTO operations.domain_change (scope, account_id, actor_account_id, command_id, target_kind, target_id, revision, policy_generation, tombstone) VALUES ('account', $1, $1, $2, 'account', $1, 1, 1, true)",
        [alice!.accountId, commandId],
      );
    });
    await expect(
      owner.query(
        "UPDATE operations.lifecycle_operation SET recovery_state = 'confirmed', revision = revision + 1, updated_at = clock_timestamp() WHERE id = $1",
        [operationId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      owner.query(
        "UPDATE operations.restriction_delivery SET state = 'confirmed', revision = revision + 1 WHERE event_id = $1",
        [eventId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      owner.query(
        "INSERT INTO operations.restriction_receipt (event_id, external_receipt, sequence, checkpoint_sha256, event_sha256, key_id) VALUES ($1, $2, 1, repeat('e',64), repeat('f',64), 'fixture-key')",
        [eventId, `fixture:${eventId}`],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    // Cleanup may finish before independent recovery confirmation arrives.
    await owner.query(
      "UPDATE operations.lifecycle_operation SET state = 'complete', terminal_at = clock_timestamp(), terminal_available_until = clock_timestamp() + interval '7 days', revision = revision + 1, updated_at = clock_timestamp() WHERE id = $1",
      [operationId],
    );
    await migrationTransaction(async (client) => {
      await client.query(
        "INSERT INTO operations.restriction_receipt (event_id, external_receipt, sequence, checkpoint_sha256, event_sha256, key_id, confirmed_at) SELECT id, $2, 1, repeat('e',64), integrity_sha256, 'fixture-key', GREATEST(clock_timestamp(), created_at) FROM operations.restriction_event WHERE id = $1",
        [eventId, `fixture:${eventId}`],
      );
      await client.query(
        "UPDATE operations.restriction_delivery SET state = 'confirmed', revision = revision + 1 WHERE event_id = $1",
        [eventId],
      );
      await client.query(
        "UPDATE operations.lifecycle_operation SET recovery_state = 'confirmed', revision = revision + 1, updated_at = clock_timestamp() WHERE id = $1",
        [operationId],
      );
      await client.query(
        "UPDATE operations.command_receipt SET result_state = 'restriction_complete' WHERE actor_account_id = $1 AND command_id = $2",
        [alice!.accountId, commandId],
      );
    });
    expect(
      (
        await runAsAccount(server, bob!, (tx) =>
          tx.execute("SELECT id FROM operations.lifecycle_operation"),
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await runAsAccount(server, bob!, (tx) =>
          tx.execute("SELECT id FROM operations.audit_event"),
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await runAsAccount(server, bob!, (tx) =>
          tx.execute("SELECT id FROM operations.account_notice"),
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await runAsAccount(server, alice!, (tx) =>
          tx.execute("SELECT id FROM operations.account_notice"),
        )
      ).rows,
    ).toEqual([{ id: noticeId }]);
    await expect(
      server.query("SELECT status_receipt_hash FROM operations.lifecycle_operation"),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      server.query("SELECT event_id FROM operations.account_notice"),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      owner.query("UPDATE operations.audit_event SET target_id = $2 WHERE id = $1", [
        auditId,
        bob!.accountId,
      ]),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      runAsAccount(server, alice!, (tx) =>
        tx.execute(
          `INSERT INTO operations.audit_event (actor_kind, actor_account_id, command_id, action, target_id, revision, policy_generation) VALUES ('account', '${alice!.accountId}', '${commandId}', 'account.delete', '${alice!.accountId}', 1, 1)`,
        ),
      ),
    ).rejects.toMatchObject({ cause: { code: "42501" } });
    for (const table of [
      "audit_event",
      "domain_change",
      "restriction_event",
      "restriction_receipt",
    ]) {
      await expect(server.query(`DELETE FROM operations.${table}`)).rejects.toMatchObject({
        code: "42501",
      });
    }
    await expect(
      owner.query(
        "UPDATE operations.lifecycle_operation SET receipt_hard_expires_at = receipt_hard_expires_at + interval '1 day', revision = revision + 1 WHERE id = $1",
        [operationId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("keeps sealed mail and abuse counters private and rejects expired delivery or payload resurrection", async () => {
    const subject = await authUser(false);
    const id = randomUUID();
    await owner.query(
      `INSERT INTO operations.email_delivery (id, purpose, recipient_key, auth_subject_id, policy_generation, key_id, ciphertext, nonce, authentication_tag, created_at, expires_at, payload_purge_after)
      VALUES ($1, 'verification', repeat('a',64), $2, 1, 'test-key', $3, $4, $5, now() - interval '2 days', now() - interval '1 day', now() - interval '23 hours')`,
      [id, subject, Buffer.alloc(32, 1), Buffer.alloc(12, 2), Buffer.alloc(16, 3)],
    );
    await expect(
      owner.query(
        "UPDATE operations.email_delivery SET state = 'sending', revision = revision + 1 WHERE id = $1",
        [id],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await owner.query(
      "UPDATE operations.email_delivery SET state = 'expired', key_id = NULL, ciphertext = NULL, nonce = NULL, authentication_tag = NULL, revision = revision + 1 WHERE id = $1",
      [id],
    );
    await expect(
      owner.query(
        "UPDATE operations.email_delivery SET state = 'queued', key_id = 'test-key', ciphertext = $2, nonce = $3, authentication_tag = $4, revision = revision + 1 WHERE id = $1",
        [id, Buffer.alloc(32), Buffer.alloc(12), Buffer.alloc(16)],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await owner.query(
      "INSERT INTO operations.abuse_counter (operation, key_hash, window_started_at, window_seconds, count, expires_at) VALUES ('auth_mail', repeat('a',64), now(), 3600, 1, now() + interval '49 hours')",
    );
    for (const pool of [auth, server, worker]) {
      await expect(
        pool.query("SELECT ciphertext FROM operations.email_delivery"),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(pool.query("SELECT * FROM operations.abuse_counter")).rejects.toMatchObject({
        code: "42501",
      });
    }
    await expect(server.query("SET ROLE kairn_access_policy")).rejects.toMatchObject({
      code: "42501",
    });
    await checkIdentityDatabase(worker);
  });

  it("uses the scoped keyset index on representative multi-account history and excludes capability fanout", async () => {
    const actors = await Promise.all([actorFixture("Plan Alice"), actorFixture("Plan Bob")]);
    await migrationTransaction(async (client) => {
      for (const actor of actors) {
        const ids = (
          await client.query(
            `INSERT INTO journeys.journey (creator_account_id, title, time_zone, start_local, start_at, start_offset_minutes, administration)
          SELECT $1, 'History plan fixture', 'UTC', '2026-11-03T09:00', '2026-11-03T09:00Z', 0, 'frozen' FROM generate_series(1, 60) RETURNING id`,
            [actor.accountId],
          )
        ).rows.map((row) => row.id);
        await client.query(
          "INSERT INTO journeys.membership (journey_id, account_id) SELECT unnest($1::uuid[]), $2",
          [ids, actor.accountId],
        );
      }
    });
    await owner.query("ANALYZE journeys.membership");
    const actor = actors[0]!;
    const query = `SELECT id, journey_id FROM journeys.membership WHERE account_id = '${actor.accountId}' AND (joined_at, id) < ('9999-12-31T00:00Z'::timestamptz, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid) ORDER BY joined_at DESC, id DESC LIMIT 20`;
    const page = await runAsAccount(server, actor, (tx) => tx.execute(query));
    expect(page.rows).toHaveLength(20);
    expect(new Set(page.rows.map((row) => row.journey_id)).size).toBe(20);
    const plan = await runAsAccount(server, actor, (tx) =>
      tx.execute(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`),
    );
    const serialized = JSON.stringify(plan.rows);
    expect(serialized).toContain("membership_account_history_idx");
    process.stdout.write(
      `B02 EXPLAIN: 120 memberships across two accounts; scoped keyset uses membership_account_history_idx; page=${page.rows.length}\n`,
    );
    const missingIndexes = await owner.query(`SELECT c.conname FROM pg_catalog.pg_constraint AS c
      JOIN pg_catalog.pg_class AS t ON t.oid = c.conrelid JOIN pg_catalog.pg_namespace AS n ON n.oid = t.relnamespace
      WHERE c.contype = 'f' AND n.nspname IN ('identity', 'journeys', 'sources', 'operations')
        AND NOT EXISTS (SELECT FROM pg_catalog.pg_index AS i WHERE i.indrelid = c.conrelid AND i.indisvalid AND i.indpred IS NULL AND i.indkey[0] = c.conkey[1])`);
    expect(missingIndexes.rows).toEqual([]);
    await checkIdentityDatabase(server);
  });
});
