import { randomUUID, randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  createDatabasePool,
  createDatabase,
  checkDatabase,
  readDatabaseUrl,
} from "@kairn/backend/database";
import { provisionVerifiedAccount, runAsAccount, type AccountActor } from "@kairn/backend/identity";
import {
  executeCommand,
  previewImpact,
  newStatusReceipt,
  consumeBudget,
  abuseKey,
  restrictionStatus,
} from "@kairn/backend/commands";
import { startJobProducer, productQueues } from "@kairn/backend/job-producer";
import {
  FileRestrictionJournal,
  confirmRestriction,
  sha256,
  verifyJournal,
  journalPublicKeys,
  type RestrictionJournal,
} from "@kairn/backend/journal";
import {
  replayRestrictions,
  fenceDatabaseWriters,
  rotateWriterCredentials,
  releaseDatabaseWriters,
} from "@kairn/backend/recovery";
import { createMailTransport, sealMail, enqueueAuthMail, deliverEmail } from "@kairn/backend/mail";
import {
  PrivateIdentityStorage,
  uploadAvatar,
  processAvatar,
  readAvatar,
  sanitizeAvatar,
  readAvatarUpload,
} from "@kairn/backend/media";
import { cleanupAvatars } from "@kairn/backend/workers";
import { registerDomainWorkers } from "@kairn/backend/workers";
import { createJobQueue } from "@kairn/backend/queue";
import { createAccountAuth, createAccountServices } from "@kairn/server/accounts-auth";
import { createApp } from "@kairn/server/app";
import { user } from "../../packages/backend/src/identity/auth-schema.js";

if (process.env.TEST_DOMAIN_ISOLATED !== "1")
  throw new Error("Use pnpm verify:domain; this suite drops only its isolated test database.");
const urls = {
  owner: readDatabaseUrl(process.env.TEST_MIGRATION_DATABASE_URL),
  server: readDatabaseUrl(process.env.TEST_SERVER_DATABASE_URL),
  auth: readDatabaseUrl(process.env.TEST_AUTH_DATABASE_URL),
  worker: readDatabaseUrl(process.env.TEST_WORKER_DATABASE_URL),
};
const makePools = () => ({
  owner: createDatabasePool(urls.owner, "domain-owner-test", 2),
  server: createDatabasePool(urls.server, "domain-api-test", 2),
  auth: createDatabasePool(urls.auth, "domain-auth-test", 2),
  worker: createDatabasePool(urls.worker, "domain-worker-test", 2),
});
let pools = makePools();
const admin = createDatabasePool(
  readDatabaseUrl(process.env.TEST_ADMIN_DATABASE_URL),
  "domain-fence-test",
  1,
);
const closePools = () => Promise.all(Object.values(pools).map((pool) => pool.end()));
let producer: Awaited<ReturnType<typeof startJobProducer>>;
let authProducer: Awaited<ReturnType<typeof startJobProducer>>;
let directory: string;
const keys = new Map([["v1", randomBytes(32)]]);
let journal: FileRestrictionJournal;
const s3 = new S3Client({
  endpoint: process.env.TEST_STORAGE_ENDPOINT!,
  region: "us-east-1",
  forcePathStyle: true,
  maxAttempts: 1,
  credentials: {
    accessKeyId: process.env.TEST_STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.TEST_STORAGE_SECRET_KEY!,
  },
});
const bucket = `kairn-identity-${randomUUID()}`;
const storage = new PrivateIdentityStorage(s3, bucket);
const transport = createMailTransport({
  host: process.env.TEST_SMTP_HOST!,
  port: 1025,
  secure: false,
  localFixture: true,
});
const mailKey = randomBytes(32);
const recipientKey = randomBytes(32);
const mailOptions = {
  keys: new Map([["v1", mailKey]]),
  recipientKey,
  origin: new URL("https://kairn.invalid"),
  from: "kairn@kairn.invalid",
  transport,
};
beforeAll(async () => {
  const expectedProject = process.env.TEST_DOMAIN_TEST_PROJECT;
  if (
    !expectedProject ||
    !/^kairn-domain-[a-f0-9]{8}$/.test(expectedProject) ||
    (await admin.query("SELECT pg_catalog.current_setting('kairn.test_project',true) AS project"))
      .rows[0]?.project !== expectedProject
  )
    throw new Error("The disposable domain database marker is missing.");
  await promisify(execFile)(
    process.execPath,
    [fileURLToPath(new URL("../../packages/backend/dist/bootstrap.js", import.meta.url))],
    { env: { ...process.env, MIGRATION_DATABASE_URL: urls.owner } },
  );
  await checkDatabase(pools.server);
  producer = await startJobProducer(pools.server, () => {});
  authProducer = await startJobProducer(pools.auth, () => {});
  directory = await mkdtemp(join(tmpdir(), "kairn-journal-"));
  journal = new FileRestrictionJournal(directory, "v1", keys);
  await s3.send(new CreateBucketCommand({ Bucket: bucket }));
});
afterAll(async () => {
  await producer?.stop();
  await authProducer?.stop();
  await closePools();
  await admin.end();
  transport.close();
  s3.destroy();
  if (directory) await rm(directory, { recursive: true, force: true });
});
async function account(name = "Domain actor", verified = true) {
  const subject = randomUUID();
  const email = `${subject}@kairn.invalid`;
  await pools.auth.query(
    'INSERT INTO authn."user"(id,name,email,email_verified) VALUES($1,$2,$3,$4)',
    [subject, name, email, verified],
  );
  return {
    ...(verified
      ? await provisionVerifiedAccount(pools.auth, subject, name)
      : { accountId: randomUUID(), accountRevision: 1, accountPolicyGeneration: 1 }),
    subject,
    email,
  };
}
async function migrationClient() {
  return pools.owner.connect();
}
async function transaction(
  operation: (client: Awaited<ReturnType<typeof migrationClient>>) => Promise<void>,
) {
  const client = await migrationClient();
  try {
    await client.query("BEGIN");
    await operation(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function journey(actors: AccountActor[], powers: string[][]) {
  const id = randomUUID();
  const memberships = actors.map(() => randomUUID());
  await transaction(async (client) => {
    await client.query(
      "INSERT INTO journeys.journey(id,creator_account_id,title,time_zone,start_local,start_at,start_offset_minutes) VALUES($1,$2,'Named journey','UTC','2026-11-03T09:00','2026-11-03T09:00Z',0)",
      [id, actors[0]!.accountId],
    );
    for (const [i, actor] of actors.entries()) {
      await client.query(
        "INSERT INTO journeys.membership(id,journey_id,account_id) VALUES($1,$2,$3)",
        [memberships[i], id, actor.accountId],
      );
      for (const power of powers[i] ?? [])
        await client.query(
          "INSERT INTO journeys.member_capability(membership_id,journey_id,membership_epoch,capability,assigned_by) VALUES($1,$2,1,$3,$4)",
          [memberships[i], id, power, actors[0]!.accountId],
        );
    }
  });
  return { id, memberships };
}
const command = (actor: AccountActor, input: unknown, commandId = randomUUID(), fresh = true) =>
  executeCommand(pools.server, actor, commandId, input, producer, { fresh });
async function source(owner: AccountActor, j: string) {
  const id = randomUUID();
  const assetId = randomUUID();
  const grantId = randomUUID();
  await command(owner, {
    type: "source.register",
    id,
    kind: "photo",
    provenance: "native_capture",
  });
  await command(owner, { type: "source_asset.register", id: assetId, sourceId: id, kind: "image" });
  // Real upload verification is a later capture boundary. This qualified SQL fixture supplies
  // actual typed source/asset identities without claiming these are delivered original bytes.
  await pools.owner.query(
    "UPDATE sources.source_asset SET state='verified',revision=revision+1,verified_bytes=12,verified_sha256=$2,content_type='image/jpeg' WHERE id=$1",
    [assetId, sha256("fixture")],
  );
  await command(owner, {
    type: "source_scope.change",
    id: grantId,
    sourceId: id,
    journeyId: j,
    generation: 1,
    revision: 0,
    scope: "publication_reuse",
  });
  return { id, assetId, grantId };
}
async function eventFor(operationId: string) {
  return (
    await pools.owner.query("SELECT id FROM operations.restriction_event WHERE operation_id=$1", [
      operationId,
    ])
  ).rows[0].id as string;
}
async function impacted(
  actor: AccountActor,
  type: "journey.archive" | "journey.delete" | "membership.leave" | "membership.remove",
  j: string,
  targetId: string,
  extra: Record<string, unknown> = {},
) {
  const actions = {
    "journey.archive": "archive",
    "journey.delete": "delete_journey",
    "membership.leave": "leave",
    "membership.remove": "remove_member",
  } as const;
  const impact = await previewImpact(pools.server, actor, {
    action: actions[type],
    journeyId: j,
    targetId,
  });
  return command(actor, {
    type,
    journeyId: j,
    revision: impact.revision,
    generation: impact.generation,
    previewId: impact.previewId,
    previewSecretHash: impact.previewSecretHash,
    ...(type.startsWith("membership.") ? { id: targetId } : {}),
    ...extra,
  });
}

describe("B03 real role command, media and delivery boundaries", () => {
  it("runs verified HTTP accounts through real auth, durable Mailpit links, reset revocation and private projections", async () => {
    const auth = createAccountAuth({
      authPool: pools.auth,
      accountPool: pools.server,
      producer: authProducer,
      origin: "https://kairn.invalid",
      secret: randomBytes(32).toString("base64url"),
      abuseKey: randomBytes(32),
      mail: { keyId: "v1", key: mailKey, recipientKey },
    });
    const services = createAccountServices({
      auth,
      pool: pools.server,
      producer,
      storage,
      origin: "https://kairn.invalid",
      abuseKey: randomBytes(32),
    });
    const app = createApp({
      publicOrigin: "https://kairn.invalid",
      web: { creator: async () => "", reader: async () => "", asset: async () => null },
      accounts: {
        handleAuth: (request) => auth.handle(request, "192.0.2.1"),
        getMyAccount: auth.getMyAccount,
        handleDomain: services.handle,
      },
    });
    const post = (path: string, body: unknown, cookie = "") =>
      app.request(`https://kairn.invalid/api/auth/${path}`, {
        method: "POST",
        headers: { origin: "https://kairn.invalid", "content-type": "application/json", cookie },
        body: JSON.stringify(body),
      });
    const me = (cookie = "") =>
      app.request("https://kairn.invalid/api/v1/me", { headers: { cookie } });
    const email = `${randomUUID()}@kairn.invalid`;
    const password = `  🏕️ a private phrase ${randomUUID()}  `;
    const signup = await post("sign-up/email", {
      name: "  Account One  ",
      email,
      password,
      callbackURL: "https://kairn.invalid/verify-email",
    });
    expect(signup.status).toBe(200);
    expect(signup.headers.get("set-cookie") ?? "").not.toContain("session_token");
    expect((await me()).status).toBe(401);
    expect((await post("sign-in/email", { email, password })).status).toBe(403);
    const subject = (await pools.auth.query('SELECT id FROM authn."user" WHERE email=$1', [email]))
      .rows[0].id;
    const sendAndRead = async (purpose: string, targetSubject = subject, targetEmail = email) => {
      const delivery = (
        await pools.owner.query(
          "SELECT id FROM operations.email_delivery WHERE auth_subject_id=$1 AND purpose=$2 ORDER BY created_at DESC LIMIT 1",
          [targetSubject, purpose],
        )
      ).rows[0];
      await deliverEmail(pools.worker, delivery.id, mailOptions);
      const inbox = await (await fetch(`${process.env.TEST_MAILPIT_URL}/api/v1/messages`)).json();
      const message = inbox.messages.find((m: { To: { Address: string }[] }) =>
        m.To.some((to) => to.Address === targetEmail),
      );
      const contents = await (
        await fetch(`${process.env.TEST_MAILPIT_URL}/api/v1/message/${message.ID}`)
      ).json();
      return new URL(contents.Text.match(/https:\/\/[^\s]+/)[0]);
    };
    const restoreVerification = async (row: Record<string, unknown>) => {
      // The pinned library may clean expired records during lookup. Restore the
      // fixture row, not just its timestamp, before testing a valid token.
      await pools.auth.query(
        "INSERT INTO authn.verification(id,identifier,value,expires_at,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET expires_at=EXCLUDED.expires_at",
        [row.id, row.identifier, row.value, row.expires_at, row.created_at, row.updated_at],
      );
    };
    const verification = await sendAndRead("verification");
    const verificationRow = (
      await pools.auth.query(
        "SELECT * FROM authn.verification WHERE value=$1 AND identifier LIKE 'kairn-email:%'",
        [subject],
      )
    ).rows[0];
    await pools.auth.query(
      "UPDATE authn.verification SET expires_at=now()-interval '1 minute' WHERE value=$1 AND identifier LIKE 'kairn-email:%'",
      [subject],
    );
    expect((await app.request(verification.href)).status).toBe(400);
    await restoreVerification(verificationRow);
    expect((await app.request(verification.href)).status).toBe(302);
    expect((await app.request(verification.href)).status).toBe(400);
    const signedIn = await post("sign-in/email", { email, password });
    expect(signedIn.status).toBe(200);
    expect((await signedIn.json()).token).toBeNull();
    expect((await post("sign-in/email", { email, password: password.trim() })).status).toBe(401);
    const cookies = signedIn.headers.getSetCookie();
    expect(cookies.some((cookie) => cookie.includes("HttpOnly") && cookie.includes("Secure"))).toBe(
      true,
    );
    const cookie = cookies.map((value) => value.split(";")[0]).join("; ");
    const ownResponse = await me(cookie);
    expect(ownResponse.status).toBe(200);
    expect(ownResponse.headers.get("cache-control")).toBe("no-store");
    const own = await ownResponse.json();
    expect(own).toMatchObject({
      privateEmail: email,
      profile: { displayName: "Account One", bio: null },
    });
    expect(JSON.stringify(own)).not.toContain(subject);
    // Two real sessions interleave through reused pools without cross-account fields.
    const secondEmail = `${randomUUID()}@kairn.invalid`;
    const secondPassword = `Another phrase ${randomUUID()}`;
    expect(
      (
        await post("sign-up/email", {
          name: "Account Two",
          email: secondEmail,
          password: secondPassword,
        })
      ).status,
    ).toBe(200);
    const secondSubject = (
      await pools.auth.query('SELECT id FROM authn."user" WHERE email=$1', [secondEmail])
    ).rows[0].id;
    const secondVerification = await sendAndRead("verification", secondSubject, secondEmail);
    expect((await app.request(secondVerification.href)).status).toBe(302);
    const secondSignIn = await post("sign-in/email", {
      email: secondEmail,
      password: secondPassword,
    });
    expect(secondSignIn.status).toBe(200);
    const secondCookie = secondSignIn.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const privateReads = await Promise.all(
      Array.from({ length: 8 }, async (_, index) => {
        const response = await me(index % 2 ? secondCookie : cookie);
        expect(response.status).toBe(200);
        return response.json();
      }),
    );
    for (const [index, read] of privateReads.entries()) {
      expect(read.privateEmail).toBe(index % 2 ? secondEmail : email);
      expect(read.accountId === own.accountId).toBe(index % 2 === 0);
    }
    // The domain profile remains authoritative after the library mirror changes.
    await pools.auth.query('UPDATE authn."user" SET name=$1 WHERE id=$2', ["Auth mirror", subject]);
    expect((await auth.getMyAccount(new Headers({ cookie })))?.profile.displayName).toBe(
      "Account One",
    );
    // Cooldown counters are intentionally durable; advance only this test fixture.
    await pools.owner.query("DELETE FROM operations.abuse_counter WHERE operation='auth_mail'");
    expect(
      (
        await post("request-password-reset", {
          email,
          redirectTo: "https://kairn.invalid/reset-password",
        })
      ).status,
    ).toBe(200);
    const reset = await sendAndRead("password_reset");
    const resetRedirect = await app.request(reset.href);
    const token = new URL(resetRedirect.headers.get("location")!).searchParams.get("token");
    expect(token).toBeTruthy();
    const resetRow = (
      await pools.auth.query("SELECT * FROM authn.verification WHERE identifier=$1", [
        `reset-password:${token}`,
      ])
    ).rows[0];
    await pools.auth.query(
      "UPDATE authn.verification SET expires_at=now()-interval '1 minute' WHERE identifier=$1",
      [`reset-password:${token}`],
    );
    expect(
      (await post("reset-password", { token, newPassword: `Valid replacement ${randomUUID()}` }))
        .status,
    ).toBe(400);
    await restoreVerification(resetRow);
    expect(
      (await post("reset-password", { token, newPassword: "correct horse battery staple" })).status,
    ).toBe(400);
    const replacement = `A new phrase ${randomUUID()}`;
    expect((await post("reset-password", { token, newPassword: replacement })).status).toBe(200);
    expect((await me(cookie)).status).toBe(401);
    expect((await post("reset-password", { token, newPassword: replacement })).status).toBe(400);
    expect((await post("sign-in/email", { email, password })).status).toBe(401);
    const fresh = await post("sign-in/email", { email, password: replacement });
    expect(fresh.status).toBe(200);
    const freshCookie = fresh.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    expect(
      (
        await post(
          "change-password",
          { currentPassword: replacement, newPassword: `${"😀".repeat(128)}x` },
          freshCookie,
        )
      ).status,
    ).toBe(400);
    const domain = (
      path: string,
      method = "GET",
      body?: unknown,
      etag?: string,
      sessionCookie = freshCookie,
    ) =>
      app.request(`https://kairn.invalid/api/v1/me${path}`, {
        method,
        headers: {
          cookie: sessionCookie,
          origin: "https://kairn.invalid",
          "content-type": "application/json",
          ...(etag ? { "if-match": etag } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    const profileCommand = {
      commandId: randomUUID(),
      displayName: "Private profile",
      bio: "A field note",
    };
    expect((await domain("/profile", "PATCH", profileCommand)).status).toBe(412);
    const updated = await domain("/profile", "PATCH", profileCommand, own.profile.etag);
    expect(updated.status).toBe(200);
    expect(await updated.json()).toMatchObject({ displayName: "Private profile", revision: 2 });
    expect((await domain("/profile", "PATCH", profileCommand, own.profile.etag)).status).toBe(200);
    expect(
      (
        await domain(
          "/profile",
          "PATCH",
          { ...profileCommand, commandId: randomUUID() },
          own.profile.etag,
        )
      ).status,
    ).toBe(412);
    expect(
      (await domain("/profile", "PATCH", { ...profileCommand, bio: "Changed" }, own.profile.etag))
        .status,
    ).toBe(409);
    const exported = await domain("/export");
    expect(exported.status).toBe(200);
    expect(await exported.json()).toMatchObject({
      account: { privateEmail: email, profile: { displayName: "Private profile" } },
      avatar: { state: "absent" },
    });
    expect((await domain("/export", "GET", undefined, undefined, secondCookie)).status).toBe(200);
    const inputBytes = await readFile(
      new URL("../fixtures/identity/avatar-metadata.png", import.meta.url),
    );
    const uploadId = randomUUID().toUpperCase();
    const allocation = await domain("/avatar/uploads", "POST", {
      commandId: randomUUID(),
      uploadId,
      contentType: "image/png",
      byteLength: inputBytes.length,
      sha256: sha256(inputBytes),
    });
    expect(allocation.status).toBe(201);
    const descriptor = await allocation.json();
    const byteWrite = (sessionCookie: string) =>
      app.request(`https://kairn.invalid${descriptor.uploadPath}`, {
        method: "PUT",
        headers: {
          cookie: sessionCookie,
          origin: "https://kairn.invalid",
          "content-type": "image/png",
        },
        body: new Uint8Array(inputBytes),
      });
    expect((await byteWrite(secondCookie)).status).not.toBe(200);
    expect((await byteWrite(freshCookie)).status).toBe(200);
    const complete = await domain(`/avatar/uploads/${uploadId}/complete`, "POST", {
      commandId: randomUUID(),
    });
    expect(complete.status).toBe(200);
    expect(await complete.json()).toEqual({
      state: "processing",
      uploadId: uploadId.toLowerCase(),
    });
    await processAvatar(pools.worker, uploadId, storage);
    const withAvatar = await (await domain("/export")).json();
    expect(withAvatar.avatar).toMatchObject({
      state: "available",
      avatarId: uploadId.toLowerCase(),
    });
    expect(JSON.stringify(withAvatar)).not.toMatch(
      /quarantine|representation_key|bucket|session_token/,
    );
    const managed = await domain("/avatar");
    expect(managed.status).toBe(200);
    expect(managed.headers.get("cache-control")).toContain("no-store");
    expect(Buffer.from(await managed.arrayBuffer()).includes(Buffer.from("Private Place"))).toBe(
      false,
    );
    expect((await domain("/avatar", "GET", undefined, undefined, secondCookie)).status).toBe(404);
    const removeAvatar = { commandId: randomUUID() };
    const removed = await domain("/avatar", "DELETE", removeAvatar, withAvatar.avatar.etag);
    expect(removed.status).toBe(202);
    const restriction = await removed.json();
    const poll = await app.request(`https://kairn.invalid${restriction.statusLocation}`, {
      headers: { cookie: freshCookie },
    });
    expect(poll.status).toBe(200);
    expect(await poll.json()).toMatchObject({ restriction: { recoveryConfirmation: "pending" } });
    expect(
      (
        await app.request(`https://kairn.invalid${restriction.statusLocation}`, {
          headers: { cookie: secondCookie },
        })
      ).status,
    ).toBe(404);
    expect((await domain("/avatar")).status).toBe(404);
    expect((await domain("/avatar", "DELETE", removeAvatar, withAvatar.avatar.etag)).status).toBe(
      202,
    );
    const sessionList = await post(
      "revoke-session",
      { token: "caller-must-not-supply-bearers" },
      freshCookie,
    );
    expect(sessionList.status).toBe(400);
    const sessions = await (
      await app.request("https://kairn.invalid/api/auth/list-sessions", {
        headers: { cookie: freshCookie },
      })
    ).json();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].current).toBe(true);
    expect(JSON.stringify(sessions)).not.toMatch(/token|userId|email/);
    const anotherSignIn = await auth.handle(
      new Request("https://kairn.invalid/api/auth/sign-in/email", {
        method: "POST",
        headers: { origin: "https://kairn.invalid", "content-type": "application/json" },
        body: JSON.stringify({ email, password: replacement }),
      }),
      "192.0.2.44",
    );
    expect(anotherSignIn.status).toBe(200);
    const anotherCookie = anotherSignIn.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const twoSessions = await (
      await app.request("https://kairn.invalid/api/auth/list-sessions", {
        headers: { cookie: freshCookie },
      })
    ).json();
    const otherSession = twoSessions.find((session: { current: boolean }) => !session.current);
    expect((await post("revoke-session", { sessionId: otherSession.id }, freshCookie)).status).toBe(
      200,
    );
    expect((await me(anotherCookie)).status).toBe(401);
    // Successful authentication releases only its in-flight reservation: repeated
    // valid sign-ins must not consume the five-failure allowance.
    for (let index = 0; index < 6; index++)
      expect((await post("sign-in/email", { email, password: replacement })).status).toBe(200);

    expect((await post("sign-out", {}, secondCookie)).status).toBe(200);
    expect((await me(secondCookie)).status).toBe(401);
    const resolved = await auth.resolve(new Headers({ cookie: freshCookie }));
    expect(resolved?.fresh).toBe(true);
    const impact = await previewImpact(pools.server, resolved!.actor, {
      action: "delete_account",
      journeyId: null,
      targetId: own.accountId,
    });
    await command(resolved!.actor, {
      type: "account.delete",
      revision: 1,
      generation: 1,
      confirmDelete: "delete",
      statusReceiptHash: newStatusReceipt().hash,
      previewId: impact.previewId,
      previewSecretHash: impact.previewSecretHash,
    });
    expect((await me(freshCookie)).status).toBe(401);
    // A still-correct password cannot create a new session for a retired subject.
    const retiredSignIn = await auth.handle(
      new Request("https://kairn.invalid/api/auth/sign-in/email", {
        method: "POST",
        headers: { origin: "https://kairn.invalid", "content-type": "application/json" },
        body: JSON.stringify({ email, password: replacement }),
      }),
      "192.0.2.2",
    );
    expect(retiredSignIn.status).toBe(403);
  });
  it("fails closed on auth input, callback bypass, abuse races and denied mail enqueue", async () => {
    const settings = {
      authPool: pools.auth,
      accountPool: pools.server,
      producer: authProducer,
      origin: "https://kairn.invalid",
      secret: randomBytes(32).toString("base64url"),
      abuseKey: randomBytes(32),
      mail: { keyId: "v1", key: mailKey, recipientKey },
    };
    const auth = createAccountAuth(settings);
    const post = (
      path: string,
      body: unknown,
      origin = "https://kairn.invalid",
      ip = "192.0.2.25",
    ) =>
      auth.handle(
        new Request(`https://kairn.invalid/api/auth/${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", origin },
          body: JSON.stringify(body),
        }),
        ip,
      );
    expect((await post("delete-user", {})).status).toBe(404);
    expect((await post("sign-in/email", {}, "https://attacker.invalid")).status).toBe(403);
    expect((await post("sign-in/email", {}, "https://kairn.invalid", "")).status).toBe(503);
    expect((await post("sign-up/email", { text: "x".repeat(65537) })).status).toBe(413);
    const invalid = {
      name: "Policy",
      email: `${randomUUID()}@kairn.invalid`,
      password: "passwordpassword",
      callbackURL: "https://kairn.invalid/verify-email",
    };
    expect((await post("sign-up/email", invalid)).status).toBe(400);
    expect(
      (
        await post("sign-up/email", {
          ...invalid,
          email: `${randomUUID()}@kairn.invalid`,
          password: `Valid ${randomUUID()}`,
          callbackURL: "https://kairn.invalid/api/auth/delete-user",
        })
      ).status,
    ).toBe(400);
    const table = (
      await pools.owner.query("SELECT table_name FROM pgboss.queue WHERE name=$1", [
        productQueues.email,
      ])
    ).rows[0].table_name;
    const email = `${randomUUID()}@kairn.invalid`;
    try {
      await pools.owner.query(`REVOKE INSERT ON pgboss."${table}" FROM kairn_auth`);
      expect(
        (await post("sign-up/email", { ...invalid, email, password: `Valid ${randomUUID()}` }))
          .status,
      ).toBe(503);
      expect(
        (await pools.auth.query('SELECT id FROM authn."user" WHERE email=$1', [email])).rowCount,
      ).toBe(0);
    } finally {
      await pools.owner.query(`GRANT INSERT ON pgboss."${table}" TO kairn_auth`);
    }
    // An unverified registration can disappear before link use. Email reuse must
    // not let that old subject's JWT verify the replacement identity.
    const reuseEmail = `${randomUUID()}@kairn.invalid`;
    expect(
      (
        await post(
          "sign-up/email",
          { name: "Original", email: reuseEmail, password: `Valid phrase ${randomUUID()}` },
          "https://kairn.invalid",
          "192.0.2.26",
        )
      ).status,
    ).toBe(200);
    const oldSubject = (
      await pools.auth.query('SELECT id FROM authn."user" WHERE email=$1', [reuseEmail])
    ).rows[0].id;
    const delivery = (
      await pools.owner.query("SELECT id FROM operations.email_delivery WHERE auth_subject_id=$1", [
        oldSubject,
      ])
    ).rows[0].id;
    await deliverEmail(pools.worker, delivery, mailOptions);
    const inbox = await (await fetch(`${process.env.TEST_MAILPIT_URL}/api/v1/messages`)).json();
    const message = inbox.messages.find((m: { To: { Address: string }[] }) =>
      m.To.some((to) => to.Address === reuseEmail),
    );
    const contents = await (
      await fetch(`${process.env.TEST_MAILPIT_URL}/api/v1/message/${message.ID}`)
    ).json();
    const oldLink = contents.Text.match(/https:\/\/[^\s]+/)[0];
    // Model retention having removed the terminal mail FK before auth-row purge.
    await pools.owner.query("DELETE FROM operations.email_delivery WHERE auth_subject_id=$1", [
      oldSubject,
    ]);
    await pools.auth.query('DELETE FROM authn."user" WHERE id=$1', [oldSubject]);
    const replacementSubject = randomUUID();
    await pools.auth.query(
      'INSERT INTO authn."user"(id,name,email,email_verified) VALUES($1,$2,$3,false)',
      [replacementSubject, "Replacement", reuseEmail],
    );
    expect((await auth.handle(new Request(oldLink), "192.0.2.26")).status).toBe(400);
    expect(
      (
        await pools.auth.query('SELECT email_verified FROM authn."user" WHERE id=$1', [
          replacementSubject,
        ])
      ).rows[0].email_verified,
    ).toBe(false);
    // Attempts survive auth rollback, and simultaneous submissions cannot all pass.
    const attempts = await Promise.all(
      Array.from({ length: 8 }, () =>
        post(
          "sign-up/email",
          { ...invalid, email: `${randomUUID()}@kairn.invalid` },
          "https://kairn.invalid",
          "192.0.2.123",
        ),
      ),
    );
    expect(attempts.filter((response) => response.status === 429)).toHaveLength(3);
  });
  it("continues late recovery after the deletion receipt expires without reopening status or account access", async () => {
    const actor = randomUUID();
    const cmd = randomUUID();
    const operation = randomUUID();
    const event = randomUUID();
    const secret = newStatusReceipt();
    await transaction(async (client) => {
      await client.query(
        "INSERT INTO identity.account(id,state,revision,policy_generation,created_at,deleted_at) VALUES($1,'deleted',2,2,now()-interval '50 days',now()-interval '46 days')",
        [actor],
      );
      await client.query(
        "INSERT INTO operations.command_receipt(actor_account_id,command_id,operation_type,payload_digest,result_state,resource_kind,resource_id,resource_revision,created_at,expires_at) VALUES($1,$2,'account.delete',$3,'restriction_pending','lifecycle_operation',$4,2,now()-interval '46 days',now()-interval '16 days')",
        [actor, cmd, sha256("historical deny"), operation],
      );
      await client.query(
        "INSERT INTO operations.lifecycle_operation(id,actor_account_id,command_id,action,resource_kind,resource_id,target_account_id,impact_digest,target_revision,policy_generation,state,processed_units,total_units,status_receipt_hash,created_at,updated_at,receipt_hard_expires_at) VALUES($1,$2,$3,'account.delete','account',$2,$2,$4,2,2,'processing',1,1,$5,now()-interval '46 days',now()-interval '44 days',now()-interval '1 day')",
        [operation, actor, cmd, sha256("historical impact"), secret.hash],
      );
      await client.query(
        "INSERT INTO operations.restriction_event(id,operation_id,kind,account_id,auth_subject_id,policy_generation,integrity_sha256,created_at) VALUES($1,$2,'account.delete',$3,$4,2,repeat('a',64),now()-interval '46 days')",
        [event, operation, actor, randomUUID()],
      );
      await client.query("INSERT INTO operations.restriction_delivery(event_id) VALUES($1)", [
        event,
      ]);
    });
    expect(await restrictionStatus(pools.server, operation, secret.secret)).toBeNull();
    await confirmRestriction(pools.worker, journal, event);
    expect(
      (
        await pools.owner.query(
          "SELECT state,recovery_state,terminal_available_until FROM operations.lifecycle_operation WHERE id=$1",
          [operation],
        )
      ).rows[0],
    ).toMatchObject({
      state: "complete",
      recovery_state: "confirmed",
      terminal_available_until: null,
    });
    await pools.worker.query("SELECT operations.retention_unit()");
    expect(
      (
        await pools.owner.query(
          "SELECT retention_state,resource_id FROM operations.command_receipt WHERE command_id=$1",
          [cmd],
        )
      ).rows[0],
    ).toMatchObject({ retention_state: "redacted", resource_id: null });
    await confirmRestriction(pools.worker, journal, event);
    expect(await restrictionStatus(pools.server, operation, secret.secret)).toBeNull();
  });
  it("characterizes actual pinned Better Auth callback rejection separately from the owned enqueue transaction", async () => {
    await promisify(execFile)(
      process.execPath,
      [
        fileURLToPath(
          new URL(
            "../../tools/identity-generation/src/qualify-mail-callbacks.mjs",
            import.meta.url,
          ),
        ),
      ],
      {
        env: {
          ...process.env,
          TEST_CALLBACK_MAIL_KEY: mailKey.toString("base64url"),
          TEST_CALLBACK_RECIPIENT_KEY: recipientKey.toString("base64url"),
        },
      },
    );
  });
  it("resumes durable restrictions after restart and queue loss despite a separate avatar cleanup failure", async () => {
    const queuedEmailIds = (
      await pools.owner.query("SELECT id FROM operations.email_delivery WHERE state='queued'")
    ).rows.map((row: { id: string }) => row.id);
    expect(queuedEmailIds).toHaveLength(2);
    const actor = await account();
    const j = await journey([actor], [["administrator"]]);
    const queue = createJobQueue(urls.worker);
    queue.on("error", () => {});
    await queue.start();
    await queue.stop({ graceful: false });
    const restriction = await impacted(actor, "journey.archive", j.id, j.id);
    expect(
      (
        await pools.owner.query(
          "SELECT recovery_state FROM operations.lifecycle_operation WHERE id=$1",
          [restriction.resourceId],
        )
      ).rows[0].recovery_state,
    ).toBe("pending");
    const strandedJourney = await journey([actor], [["administrator"]]);
    const stranded = await impacted(
      actor,
      "journey.archive",
      strandedJourney.id,
      strandedJourney.id,
    );
    const strandedEvent = await eventFor(stranded.resourceId);
    // Model retry exhaustion/lost dispatch without deleting its durable event.
    await pools.owner.query("DELETE FROM pgboss.job WHERE id=$1", [strandedEvent]);
    const oldBucketAvatar = randomUUID();
    await pools.owner.query(
      "INSERT INTO identity.profile_avatar(id,owner_account_id,quarantine_bucket,quarantine_key,input_content_type,input_bytes,input_sha256,created_at,upload_expires_at) VALUES($1,$2,'previous-private-bucket',$3,'image/png',1,repeat('a',64),now()-interval '2 hours',now()-interval '1 hour')",
      [oldBucketAvatar, actor.accountId, `quarantine/${actor.accountId}/${oldBucketAvatar}`],
    );
    const restarted = createJobQueue(urls.worker);
    restarted.on("error", () => {});
    await restarted.start();
    let cleanupFailures = 0;
    const handlers = await registerDomainWorkers(restarted, pools.worker, {
      journal,
      storage,
      mail: mailOptions,
      onError: () => {
        cleanupFailures++;
      },
    });
    try {
      await expect
        .poll(
          async () =>
            (
              await pools.owner.query(
                "SELECT recovery_state FROM operations.lifecycle_operation WHERE id=$1",
                [restriction.resourceId],
              )
            ).rows[0]?.recovery_state,
          { timeout: 15000 },
        )
        .toBe("confirmed");
      await expect
        .poll(
          async () =>
            Number(
              (
                await pools.owner.query(
                  "SELECT count(*) n FROM operations.email_delivery WHERE state='smtp_accepted' AND id=ANY($1::uuid[])",
                  [queuedEmailIds],
                )
              ).rows[0].n,
            ),
          { timeout: 15000 },
        )
        .toBe(2);
      await expect
        .poll(
          async () =>
            (
              await pools.owner.query(
                "SELECT recovery_state FROM operations.lifecycle_operation WHERE id=$1",
                [stranded.resourceId],
              )
            ).rows[0]?.recovery_state,
          { timeout: 40000 },
        )
        .toBe("confirmed");
      await expect.poll(() => cleanupFailures).toBeGreaterThan(0);
    } finally {
      await handlers.stop();
      await restarted.stop({ graceful: true, timeout: 5000 });
      await pools.owner.query("DELETE FROM identity.profile_avatar WHERE id=$1", [oldBucketAvatar]);
    }
  });
  it("serializes command retries, rejects digest conflicts and atomically rolls back deny/audit/notice/event on denied enqueue", async () => {
    const owner = await account();
    const member = await account();
    const j = await journey([owner, member], [["administrator"], []]);
    const id = randomUUID();
    const input = { type: "profile.update", displayName: "Saved name", bio: null, revision: 1 };
    const repeated = await Promise.all([command(owner, input, id), command(owner, input, id)]);
    expect(repeated.map((r) => r.replayed).sort((a, b) => Number(a) - Number(b))).toEqual([
      false,
      true,
    ]);
    await expect(command(owner, { ...input, displayName: "Conflict" }, id)).rejects.toMatchObject({
      cause: { code: "23505" },
    });
    expect(
      (
        await pools.owner.query(
          "SELECT count(*)::int n FROM operations.audit_event WHERE command_id=$1",
          [id],
        )
      ).rows[0].n,
    ).toBe(1);
    const impact = await previewImpact(pools.server, owner, {
      action: "remove_member",
      journeyId: j.id,
      targetId: j.memberships[1]!,
    });
    const queue = (
      await pools.owner.query("SELECT table_name FROM pgboss.queue WHERE name=$1", [
        productQueues.restriction,
      ])
    ).rows[0].table_name as string;
    const table = `pgboss."${queue.replaceAll('"', '""')}"`;
    const deniedId = randomUUID();
    await pools.owner.query(`REVOKE INSERT ON ${table} FROM kairn_server`);
    try {
      await expect(
        command(
          owner,
          {
            type: "membership.remove",
            journeyId: j.id,
            id: j.memberships[1],
            revision: 1,
            generation: 1,
            previewId: impact.previewId,
            previewSecretHash: impact.previewSecretHash,
          },
          deniedId,
        ),
      ).rejects.toMatchObject({ cause: { code: "42501" } });
    } finally {
      await pools.owner.query(`GRANT INSERT ON ${table} TO kairn_server`);
    }
    expect(
      (
        await pools.owner.query("SELECT state FROM journeys.membership WHERE id=$1", [
          j.memberships[1],
        ])
      ).rows[0].state,
    ).toBe("active");
    for (const table of ["command_receipt", "audit_event", "domain_change"])
      expect(
        (
          await pools.owner.query(
            `SELECT count(*)::int n FROM operations.${table} WHERE command_id=$1`,
            [deniedId],
          )
        ).rows[0].n,
      ).toBe(0);
    expect(
      (
        await pools.owner.query(
          "SELECT count(*)::int n FROM operations.account_notice WHERE recipient_account_id=$1",
          [member.accountId],
        )
      ).rows[0].n,
    ).toBe(0);
    await expect(
      command(member, {
        type: "invitation.revoke",
        journeyId: j.id,
        id: randomUUID(),
        revision: 1,
        generation: 1,
      }),
    ).rejects.toMatchObject({ cause: { code: "42501" } });
  });
  it("pins exact assets for a participant, rejects wrong owners/expired approval, and denies exports immediately on withdrawal", async () => {
    const owner = await account();
    const recipient = await account();
    const adminOnly = await account();
    const outsider = await account();
    const j = await journey([adminOnly, owner, recipient], [["administrator"], [], []]);
    const s = await source(owner, j.id);
    const requestId = randomUUID();
    await expect(
      command(recipient, {
        type: "export.request",
        journeyId: j.id,
        generation: 1,
        id: requestId,
        ownerId: owner.accountId,
        assetIds: [s.assetId, randomUUID()],
      }),
    ).rejects.toMatchObject({ cause: { code: "42501" } });
    await command(recipient, {
      type: "export.request",
      journeyId: j.id,
      generation: 1,
      id: requestId,
      ownerId: owner.accountId,
      assetIds: [s.assetId],
    });
    await expect(
      command(outsider, {
        type: "export.approve",
        journeyId: j.id,
        generation: 1,
        id: randomUUID(),
        requestId,
        revision: 1,
        hours: 24,
      }),
    ).rejects.toMatchObject({ cause: { code: "42501" } });
    const grant = await command(owner, {
      type: "export.approve",
      journeyId: j.id,
      generation: 1,
      id: randomUUID(),
      requestId,
      revision: 1,
      hours: 24,
    });
    const allowed = () =>
      runAsAccount(pools.server, recipient, (tx) =>
        tx.execute(
          `SELECT sources.actor_can_export_asset('${s.assetId}','${grant.resourceId}') AS allowed`,
        ),
      );
    expect((await allowed()).rows[0]?.allowed).toBe(true);
    expect(
      (
        await runAsAccount(pools.server, adminOnly, (tx) =>
          tx.execute("SELECT id FROM sources.source"),
        )
      ).rows,
    ).toEqual([]);
    const restriction = await command(owner, {
      type: "source_grant.withdraw",
      journeyId: j.id,
      generation: 1,
      id: s.grantId,
      sourceId: s.id,
      revision: 1,
    });
    expect(restriction.state).toBe("restriction_pending");
    expect((await allowed()).rows[0]?.allowed).toBe(false);
    const e = await eventFor(restriction.resourceId);
    const unavailable: RestrictionJournal = {
      append: async () => {
        throw new Error("offline");
      },
      read: () => journal.read(),
    };
    await expect(confirmRestriction(pools.worker, unavailable, e)).rejects.toThrow("pending");
    const uncertain: RestrictionJournal = {
      read: () => journal.read(),
      append: async (body, hash) => {
        await journal.append(body, hash);
        throw new Error("lost response");
      },
    };
    await expect(confirmRestriction(pools.worker, uncertain, e)).rejects.toThrow("pending");
    await confirmRestriction(pools.worker, journal, e);
    await confirmRestriction(pools.worker, journal, e);
    expect((await journal.read()).filter((entry) => JSON.parse(entry.body).id === e)).toHaveLength(
      1,
    );
    expect(
      (
        await pools.owner.query(
          "SELECT recovery_state FROM operations.lifecycle_operation WHERE id=$1",
          [restriction.resourceId],
        )
      ).rows[0].recovery_state,
    ).toBe("confirmed");
    await expect(
      command(owner, {
        type: "source_grant.withdraw",
        journeyId: j.id,
        generation: 1,
        id: s.grantId,
        sourceId: s.id,
        revision: 1,
      }),
    ).rejects.toMatchObject({ cause: { code: "40001" } });
  });
  it("seals auth mail on its enqueue transaction, sends once to Mailpit, rejects stale/repeated/expired payloads and propagates callback failure", async () => {
    const recipient = await account("Unverified", false);
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 600000);
    const binding = {
      id,
      purpose: "verification" as const,
      generation: 1,
      recipientKey: abuseKey(recipientKey, "mail", recipient.email),
      expiresAt,
    };
    const sealed = sealMail(
      binding,
      {
        to: recipient.email,
        url: "https://kairn.invalid/api/auth/verify-email?token=private-fixture",
      },
      "v1",
      mailKey,
    );
    await createDatabase(pools.auth).transaction((tx) =>
      enqueueAuthMail(tx, authProducer, { ...binding, subject: recipient.subject }, sealed),
    );
    await deliverEmail(pools.worker, id, mailOptions);
    await deliverEmail(pools.worker, id, mailOptions);
    const messages = await (await fetch(`${process.env.TEST_MAILPIT_URL}/api/v1/messages`)).json();
    expect(
      messages.messages.filter((m: { To: { Address: string }[] }) =>
        m.To.some((to) => to.Address === recipient.email),
      ),
    ).toHaveLength(1);
    const mail = (
      await pools.owner.query(
        "SELECT state,ciphertext FROM operations.email_delivery WHERE id=$1",
        [id],
      )
    ).rows[0];
    expect(mail).toMatchObject({ state: "smtp_accepted", ciphertext: null });
    const staleId = randomUUID();
    const stale = { ...binding, id: staleId };
    await createDatabase(pools.auth).transaction((tx) =>
      enqueueAuthMail(
        tx,
        authProducer,
        { ...stale, subject: recipient.subject },
        sealMail(
          stale,
          { to: recipient.email, url: "https://kairn.invalid/api/auth/verify-email?token=old" },
          "v1",
          mailKey,
        ),
      ),
    );
    await pools.auth.query('UPDATE authn."user" SET email_verified=true WHERE id=$1', [
      recipient.subject,
    ]);
    await deliverEmail(pools.worker, staleId, mailOptions);
    expect(
      (
        await pools.owner.query(
          "SELECT state,ciphertext FROM operations.email_delivery WHERE id=$1",
          [staleId],
        )
      ).rows[0],
    ).toMatchObject({ state: "cancelled", ciphertext: null });
    const expiringRecipient = await account("Expiring mail", false);
    const expired = {
      ...binding,
      id: randomUUID(),
      recipientKey: abuseKey(recipientKey, "mail", expiringRecipient.email),
      expiresAt: new Date(Date.now() + 1500),
    };
    await createDatabase(pools.auth).transaction((tx) =>
      enqueueAuthMail(
        tx,
        authProducer,
        { ...expired, subject: expiringRecipient.subject },
        sealMail(
          expired,
          {
            to: expiringRecipient.email,
            url: "https://kairn.invalid/api/auth/verify-email?token=expired",
          },
          "v1",
          mailKey,
        ),
      ),
    );
    await expect
      .poll(
        async () =>
          (
            await pools.owner.query(
              "SELECT expires_at<=clock_timestamp() AS expired FROM operations.email_delivery WHERE id=$1",
              [expired.id],
            )
          ).rows[0].expired,
        { timeout: 5000 },
      )
      .toBe(true);
    await deliverEmail(pools.worker, expired.id, mailOptions);
    expect(
      (
        await pools.owner.query(
          "SELECT state,ciphertext FROM operations.email_delivery WHERE id=$1",
          [expired.id],
        )
      ).rows[0],
    ).toMatchObject({ state: "expired", ciphertext: null });
    const token = randomBytes(18).toString("base64url");
    const verificationId = randomUUID();
    await pools.auth.query(
      "INSERT INTO authn.verification(id,identifier,value,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes')",
      [verificationId, `reset-password:${token}`, recipient.subject],
    );
    const consumed = {
      ...binding,
      id: randomUUID(),
      purpose: "password_reset" as const,
      expiresAt: new Date(Date.now() + 1200000),
    };
    await createDatabase(pools.auth).transaction((tx) =>
      enqueueAuthMail(
        tx,
        authProducer,
        { ...consumed, subject: recipient.subject },
        sealMail(
          consumed,
          {
            to: recipient.email,
            url: `https://kairn.invalid/api/auth/reset-password/${token}?callbackURL=%2Freset-password`,
          },
          "v1",
          mailKey,
        ),
      ),
    );
    await pools.auth.query("DELETE FROM authn.verification WHERE id=$1", [verificationId]);
    await deliverEmail(pools.worker, consumed.id, mailOptions);
    expect(
      (
        await pools.owner.query(
          "SELECT state,ciphertext FROM operations.email_delivery WHERE id=$1",
          [consumed.id],
        )
      ).rows[0],
    ).toMatchObject({ state: "cancelled", ciphertext: null });
    const table = (
      await pools.owner.query("SELECT table_name FROM pgboss.queue WHERE name=$1", [
        productQueues.email,
      ])
    ).rows[0].table_name as string;
    await pools.owner.query(`REVOKE INSERT ON pgboss."${table}" FROM kairn_auth`);
    const subject = randomUUID();
    const deniedId = randomUUID();
    const denied = { ...binding, id: deniedId };
    try {
      await expect(
        createDatabase(pools.auth).transaction(async (tx) => {
          await tx
            .insert(user)
            .values({ id: subject, name: "Callback rollback", email: `${subject}@kairn.invalid` });
          await enqueueAuthMail(
            tx,
            authProducer,
            { ...denied, subject },
            sealMail(
              denied,
              {
                to: `${subject}@kairn.invalid`,
                url: "https://kairn.invalid/api/auth/verify-email?token=x",
              },
              "v1",
              mailKey,
            ),
          );
        }),
      ).rejects.toMatchObject({ cause: { code: "42501" } });
    } finally {
      await pools.owner.query(`GRANT INSERT ON pgboss."${table}" TO kairn_auth`);
    }
    expect(
      (await pools.auth.query('SELECT id FROM authn."user" WHERE id=$1', [subject])).rows,
    ).toEqual([]);
    expect(
      (await pools.owner.query("SELECT id FROM operations.email_delivery WHERE id=$1", [deniedId]))
        .rows,
    ).toEqual([]);
    await expect(
      pools.server.query("SELECT ciphertext FROM operations.email_delivery"),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("enforces concurrent budgets and an actual 60-second target cooldown without exposing raw targets", async () => {
    const hash = abuseKey(randomBytes(32), "registration:ip", "192.0.2.1");
    const allowed = await Promise.all(
      Array.from({ length: 12 }, () => consumeBudget(pools.auth, "register", hash, "ip")),
    );
    expect(allowed.filter(Boolean)).toHaveLength(5);
    const cooldown = abuseKey(randomBytes(32), "auth_mail:cooldown", "private@kairn.invalid");
    expect(await consumeBudget(pools.auth, "auth_mail", cooldown, "cooldown")).toBe(true);
    expect(await consumeBudget(pools.auth, "auth_mail", cooldown, "cooldown")).toBe(false);
    const expiredKey = sha256(randomUUID());
    await pools.owner.query(
      "INSERT INTO operations.abuse_counter(operation,key_hash,window_started_at,window_seconds,count,expires_at) VALUES('auth_mail',$1,now()-interval '4 days',60,1,now()-interval '3 days')",
      [expiredKey],
    );
    await pools.worker.query("SELECT operations.retention_unit()");
    expect(
      (
        await pools.owner.query("SELECT key_hash FROM operations.abuse_counter WHERE key_hash=$1", [
          expiredKey,
        ])
      ).rows,
    ).toEqual([]);
    await expect(
      pools.server.query("SELECT * FROM operations.abuse_counter"),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("sanitizes real private S3 avatars, retains replacements on failure, denies stale jobs and cleans bounded objects", async () => {
    const actor = await account();
    const other = await account();
    const bytes = await readFile(
      new URL("../fixtures/identity/avatar-metadata.png", import.meta.url),
    );
    const begin = async () => {
      const id = randomUUID();
      await command(actor, {
        type: "avatar.create",
        id,
        contentType: "image/png",
        bytes: bytes.length,
        sha256: sha256(bytes),
        bucket,
      });
      return id;
    };
    const id = await begin();
    const completionCommand = randomUUID();
    await expect(
      command(actor, { type: "avatar.replace", id }, completionCommand),
    ).rejects.toMatchObject({ cause: { code: "42501" } });
    await uploadAvatar(pools.server, actor, id, bytes, storage);
    await uploadAvatar(pools.server, actor, id, bytes, storage);
    await expect(
      storage.put(
        bucket,
        `quarantine/${actor.accountId}/${id}`,
        Buffer.from("different immutable bytes"),
        "image/png",
      ),
    ).rejects.toThrow("conflict");
    await expect(
      readAvatarUpload(
        new Request("https://kairn.invalid/avatar", {
          method: "POST",
          headers: { "content-type": "image/png" },
          body: new Uint8Array(5242881),
        }),
      ),
    ).rejects.toThrow("limit");
    await expect(uploadAvatar(pools.server, other, id, bytes, storage)).rejects.toThrow();
    await command(actor, { type: "avatar.replace", id }, completionCommand);
    await processAvatar(pools.worker, id, storage);
    await processAvatar(pools.worker, id, storage);
    const clean = await readAvatar(pools.server, actor, storage);
    expect(clean?.bytes.includes(Buffer.from("Private Place"))).toBe(false);
    expect(clean?.contentType).toBe("image/jpeg");
    expect(await readAvatar(pools.server, other, storage)).toBeNull();
    const bad = await begin();
    await uploadAvatar(pools.server, actor, bad, bytes, storage);
    await command(actor, { type: "avatar.replace", id: bad });
    await s3.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: `quarantine/${actor.accountId}/${bad}` }),
    );
    await expect(processAvatar(pools.worker, bad, storage)).rejects.toThrow();
    expect((await readAvatar(pools.server, actor, storage))?.bytes).toEqual(clean?.bytes);
    await expect(
      sanitizeAvatar(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')),
    ).rejects.toThrow();
    await expect(
      sanitizeAvatar(
        await readFile(new URL("../fixtures/identity/avatar-pixel-limit.png", import.meta.url)),
      ),
    ).rejects.toThrow();
    const rev = Number(
      (await pools.owner.query("SELECT revision FROM identity.profile_avatar WHERE id=$1", [id]))
        .rows[0].revision,
    );
    const deletion = await command(actor, { type: "avatar.delete", id, revision: rev });
    expect(await readAvatar(pools.server, actor, storage)).toBeNull();
    await processAvatar(pools.worker, id, storage);
    const event = await eventFor(deletion.resourceId);
    const blocker = await pools.owner.connect();
    await blocker.query("BEGIN");
    await blocker.query("SELECT id FROM operations.lifecycle_operation WHERE id=$1 FOR UPDATE", [
      deletion.resourceId,
    ]);
    const completion = Promise.all([
      confirmRestriction(pools.worker, journal, event),
      cleanupAvatars(pools.worker, storage),
    ]);
    void completion.catch(() => {});
    try {
      await expect
        .poll(
          async () =>
            Number(
              (
                await admin.query(
                  "SELECT count(*) n FROM pg_catalog.pg_stat_activity WHERE application_name='domain-worker-test' AND wait_event_type='Lock'",
                )
              ).rows[0].n,
            ),
          { timeout: 3000 },
        )
        .toBe(2);
    } finally {
      await blocker.query("COMMIT");
      blocker.release();
    }
    await completion;
    expect(
      (
        await pools.owner.query(
          "SELECT state,recovery_state,processed_units FROM operations.lifecycle_operation WHERE id=$1",
          [deletion.resourceId],
        )
      ).rows[0],
    ).toMatchObject({ state: "complete", recovery_state: "confirmed", processed_units: 1 });
    await expect(
      command(actor, {
        type: "avatar.create",
        id,
        contentType: "image/png",
        bytes: bytes.length,
        sha256: sha256(bytes),
        bucket,
      }),
    ).rejects.toMatchObject({ cause: { code: "23505" } });
    await expect(
      s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: `avatars/${actor.accountId}/${id}.jpg` }),
      ),
    ).rejects.toThrow();
  });
});

it("restores a pre-restriction database under real writer fences, verifies the independent head and rejects old credentials/stale jobs", async () => {
  const owner = await account("Recovery administrator");
  const successor = await account("Eligible coauthor");
  const sourceOwner = await account("Original owner");
  const recipient = await account("Named recipient");
  const deleting = await account("Deleting actor");
  const offered = await journey([owner, successor], [["administrator"], ["coauthor"]]);
  const archived = await journey([owner], [["administrator"]]);
  const departed = await journey([owner], [["administrator"]]);
  const deleted = await journey([owner, recipient], [["administrator"], []]);
  const shared = await journey([owner, sourceOwner, recipient], [["administrator"], [], []]);
  const deletingJourney = await journey([deleting], [["administrator"]]);
  const sourceItem = await source(sourceOwner, shared.id);
  const separate = await source(sourceOwner, shared.id);
  const requestId = randomUUID();
  await command(recipient, {
    type: "export.request",
    journeyId: shared.id,
    generation: 1,
    id: requestId,
    ownerId: sourceOwner.accountId,
    assetIds: [separate.assetId],
  });
  const exportGrant = await command(sourceOwner, {
    type: "export.approve",
    journeyId: shared.id,
    generation: 1,
    id: randomUUID(),
    requestId,
    revision: 1,
    hours: 24,
  });
  const invite = randomUUID();
  const transfer = randomUUID();
  const guard = randomUUID();
  await pools.owner.query(
    "INSERT INTO journeys.recipient_guard(id,journey_id,recipient_key,recipient_email) VALUES($1,$2,$3,$4)",
    [guard, offered.id, sha256(randomUUID()), "recipient@kairn.invalid"],
  );
  await pools.owner.query(
    "INSERT INTO journeys.invitation(id,journey_id,guard_id,admission_epoch,inviter_membership_id,inviter_account_id,inviter_membership_epoch,secret_hash,expires_at) VALUES($1,$2,$3,1,$4,$5,1,$6,now()+interval '7 days')",
    [invite, offered.id, guard, offered.memberships[0], owner.accountId, sha256(randomUUID())],
  );
  await pools.owner.query(
    "INSERT INTO journeys.administration_transfer(id,journey_id,offering_membership_id,offering_account_id,offering_epoch,target_membership_id,target_account_id,target_epoch,journey_policy_generation,expires_at) VALUES($1,$2,$3,$4,1,$5,$6,1,1,now()+interval '72 hours')",
    [
      transfer,
      offered.id,
      offered.memberships[0],
      owner.accountId,
      offered.memberships[1],
      successor.accountId,
    ],
  );
  // Clone the actual durable database, then mutate through the non-owner service boundary.
  await producer.stop();
  await authProducer.stop();
  await closePools();
  await admin.query("CREATE DATABASE kairn_domain_snapshot WITH TEMPLATE kairn");
  pools = makePools();
  for (const pool of Object.values(pools)) pool.on("error", () => {});
  producer = await startJobProducer(pools.server, () => {});
  authProducer = await startJobProducer(pools.auth, () => {});
  const operations = [];
  operations.push(
    await command(owner, {
      type: "invitation.revoke",
      journeyId: offered.id,
      generation: 1,
      id: invite,
      revision: 1,
    }),
  );
  operations.push(
    await command(owner, {
      type: "transfer.cancel",
      journeyId: offered.id,
      generation: 1,
      id: transfer,
      revision: 1,
    }),
  );
  operations.push(await impacted(owner, "journey.archive", archived.id, archived.id));
  operations.push(await impacted(owner, "membership.leave", departed.id, departed.memberships[0]!));
  operations.push(
    await impacted(owner, "journey.delete", deleted.id, deleted.id, {
      confirmTitle: "Named journey",
      confirmDelete: "delete",
    }),
  );
  operations.push(
    await command(sourceOwner, {
      type: "source_grant.withdraw",
      journeyId: shared.id,
      generation: 1,
      id: sourceItem.grantId,
      sourceId: sourceItem.id,
      revision: 1,
    }),
  );
  operations.push(
    await command(sourceOwner, {
      type: "export.revoke",
      journeyId: shared.id,
      generation: 1,
      id: exportGrant.resourceId,
      revision: 1,
    }),
  );
  const receipt = newStatusReceipt();
  const impact = await previewImpact(pools.server, deleting, {
    action: "delete_account",
    journeyId: null,
    targetId: deleting.accountId,
  });
  const deletion = await command(deleting, {
    type: "account.delete",
    revision: 1,
    generation: 1,
    confirmDelete: "delete",
    statusReceiptHash: receipt.hash,
    previewId: impact.previewId,
    previewSecretHash: impact.previewSecretHash,
  });
  operations.push(deletion);
  await expect(
    runAsAccount(pools.server, deleting, (tx) => tx.execute("SELECT id FROM identity.profile")),
  ).rejects.toThrow("unavailable");
  expect(await restrictionStatus(pools.server, deletion.resourceId, receipt.secret)).toMatchObject({
    recoveryState: "pending",
  });
  expect(
    await restrictionStatus(pools.server, deletion.resourceId, newStatusReceipt().secret),
  ).toBeNull();
  for (const operation of operations)
    await confirmRestriction(pools.worker, journal, await eventFor(operation.resourceId));
  expect(await restrictionStatus(pools.server, deletion.resourceId, receipt.secret)).toMatchObject({
    state: "processing",
    recoveryState: "confirmed",
  });
  const entries = await journal.read();
  const head = { sequence: entries.length, checkpointSha256: entries.at(-1)!.checkpointSha256 };
  await producer.stop();
  await authProducer.stop();
  const oldConnection = await pools.server.connect();
  await oldConnection.query("BEGIN");
  const oldCommand = randomUUID();
  await oldConnection.query("SELECT set_config('kairn.account_id',$1,true)", [owner.accountId]);
  await oldConnection.query("SELECT operations.execute_command($1,'profile.update',$2::jsonb)", [
    oldCommand,
    JSON.stringify({ displayName: "Must not survive the fence", bio: null, revision: 1 }),
  ]);
  const oldWorker = await pools.worker.connect();
  await oldWorker.query("BEGIN");
  await oldWorker.query("SELECT operations.account_cleanup_unit($1)", [deletion.resourceId]);
  await fenceDatabaseWriters(admin);
  await expect(oldConnection.query("COMMIT")).rejects.toThrow();
  oldConnection.release(true);
  await expect(oldWorker.query("COMMIT")).rejects.toThrow();
  oldWorker.release(true);
  expect(
    (
      await pools.owner.query("SELECT display_name FROM identity.profile WHERE account_id=$1", [
        owner.accountId,
      ])
    ).rows[0].display_name,
  ).toBe("Recovery administrator");
  expect(
    (
      await pools.owner.query(
        "SELECT command_id FROM operations.command_receipt WHERE command_id=$1",
        [oldCommand],
      )
    ).rows,
  ).toEqual([]);
  expect(
    (
      await pools.owner.query("SELECT state FROM journeys.membership WHERE id=$1", [
        deletingJourney.memberships[0],
      ])
    ).rows[0].state,
  ).toBe("active");
  const probe = createDatabasePool(urls.server, "old-reconnect-test", 1);
  await expect(probe.query("SELECT 1")).rejects.toThrow();
  await probe.end();
  await closePools();
  await admin.query("DROP DATABASE kairn WITH (FORCE)");
  await admin.query(
    "CREATE DATABASE kairn WITH TEMPLATE kairn_domain_snapshot OWNER kairn_migrator",
  );
  await fenceDatabaseWriters(admin);
  const replayPool = createDatabasePool(urls.owner, "controlled-replay-test", 1);
  try {
    const truncated: RestrictionJournal = {
      append: (body, hash) => journal.append(body, hash),
      read: async () => entries.slice(0, -1),
    };
    await expect(
      replayRestrictions(replayPool, truncated, journalPublicKeys(keys), head),
    ).rejects.toThrow("incomplete");
    const corrupt = entries.map((entry, i) =>
      i === entries.length - 1
        ? { ...entry, body: entry.body.replace('"generation": 1', '"generation": 2') }
        : entry,
    );
    // A signature mutation always fails even if the last generation was not one.
    corrupt[corrupt.length - 1] = { ...corrupt.at(-1)!, receipt: "0".repeat(64) };
    expect(() => verifyJournal(corrupt, journalPublicKeys(keys))).toThrow();
    await replayRestrictions(replayPool, journal, journalPublicKeys(keys), head);
    await replayRestrictions(replayPool, journal, journalPublicKeys(keys), head);
    expect(
      (await replayPool.query("SELECT state FROM journeys.invitation WHERE id=$1", [invite]))
        .rows[0].state,
    ).toBe("revoked");
    expect(
      (
        await replayPool.query("SELECT state FROM journeys.administration_transfer WHERE id=$1", [
          transfer,
        ])
      ).rows[0].state,
    ).toBe("invalidated");
    expect(
      (await replayPool.query("SELECT lifecycle FROM journeys.journey WHERE id=$1", [archived.id]))
        .rows[0].lifecycle,
    ).toBe("archived");
    expect(
      (
        await replayPool.query("SELECT administration FROM journeys.journey WHERE id=$1", [
          departed.id,
        ])
      ).rows[0].administration,
    ).toBe("frozen");
    expect(
      (await replayPool.query("SELECT lifecycle FROM journeys.journey WHERE id=$1", [deleted.id]))
        .rows[0].lifecycle,
    ).toBe("deleted");
    expect(
      (
        await replayPool.query("SELECT state FROM sources.source_grant WHERE id=$1", [
          sourceItem.grantId,
        ])
      ).rows[0].state,
    ).toBe("withdrawn");
    expect(
      (
        await replayPool.query("SELECT state FROM sources.export_grant WHERE id=$1", [
          exportGrant.resourceId,
        ])
      ).rows[0].state,
    ).toBe("invalidated");
    expect(
      (
        await replayPool.query("SELECT state FROM identity.account WHERE id=$1", [
          deleting.accountId,
        ])
      ).rows[0].state,
    ).toBe("deleting");
  } finally {
    await replayPool.end();
  }
  const passwords = {
    kairn_server: randomBytes(32).toString("base64url"),
    kairn_auth: randomBytes(32).toString("base64url"),
    kairn_worker: randomBytes(32).toString("base64url"),
  };
  await rotateWriterCredentials(admin, passwords);
  const releaseUrl = new URL(process.env.TEST_ADMIN_DATABASE_URL!);
  releaseUrl.pathname = "/kairn";
  const boundaryPool = createDatabasePool(releaseUrl.href, "release-proof-test", 1);
  try {
    await releaseDatabaseWriters(boundaryPool, head);
  } finally {
    await boundaryPool.end();
  }
  for (const [name, role] of [
    ["server", "kairn_server"],
    ["auth", "kairn_auth"],
    ["worker", "kairn_worker"],
  ] as const) {
    const rejected = createDatabasePool(urls[name], "old-generation-probe", 1);
    await expect(rejected.query("SELECT 1")).rejects.toThrow();
    await rejected.end();
    const url = new URL(urls[name]);
    url.password = passwords[role];
    urls[name] = url.href;
  }
  pools = makePools();
  for (const pool of Object.values(pools)) pool.on("error", () => {});
  producer = await startJobProducer(pools.server, () => {});
  authProducer = await startJobProducer(pools.auth, () => {});
  await checkDatabase(pools.server);
  expect(
    (
      await runAsAccount(pools.server, recipient, (tx) =>
        tx.execute(
          `SELECT sources.actor_can_export_asset('${separate.assetId}','${exportGrant.resourceId}') AS allowed`,
        ),
      )
    ).rows[0]?.allowed,
  ).toBe(false);
  await pools.worker.query("SELECT operations.account_cleanup_unit($1)", [deleting.accountId]);
  await pools.worker.query("SELECT operations.account_cleanup_unit($1)", [deleting.accountId]);
  expect(
    (
      await pools.owner.query("SELECT administration FROM journeys.journey WHERE id=$1", [
        deletingJourney.id,
      ])
    ).rows[0].administration,
  ).toBe("frozen");
  expect(
    (
      await pools.owner.query("SELECT state,auth_subject_id FROM identity.account WHERE id=$1", [
        deleting.accountId,
      ])
    ).rows[0],
  ).toMatchObject({ state: "deleted", auth_subject_id: null });
  await expect(
    provisionVerifiedAccount(pools.auth, deleting.subject, "Must not restore history"),
  ).rejects.toThrow();
  await admin.query("DROP DATABASE kairn_domain_snapshot");
});

// Backup deliberately predates both the domain account and the original avatar command.
it("restores signed identity denies across missing allocations and rejects legacy gaps", async () => {
  const subject = randomUUID();
  await pools.auth.query(
    'INSERT INTO authn."user"(id,name,email,email_verified) VALUES($1,$2,$3,true)',
    [subject, "Before provisioning", `${subject}@kairn.invalid`],
  );
  const avatarOwner = await account("Before avatar allocation");
  const presentId = randomUUID();
  const presentBytes = await readFile(
    new URL("../fixtures/identity/avatar-metadata.png", import.meta.url),
  );
  await command(avatarOwner, {
    type: "avatar.create",
    id: presentId,
    contentType: "image/png",
    bytes: presentBytes.length,
    sha256: sha256(presentBytes),
    bucket,
  });
  await uploadAvatar(pools.server, avatarOwner, presentId, presentBytes, storage);
  await command(avatarOwner, { type: "avatar.replace", id: presentId });
  await processAvatar(pools.worker, presentId, storage);
  const present = (
    await pools.owner.query(
      "SELECT revision,representation_key,representation_sha256 FROM identity.profile_avatar WHERE id=$1",
      [presentId],
    )
  ).rows[0];
  expect(await readAvatar(pools.server, avatarOwner, storage)).not.toBeNull();

  await producer.stop();
  await authProducer.stop();
  await closePools();
  await admin.query("CREATE DATABASE kairn_identity_snapshot WITH TEMPLATE kairn");
  pools = makePools();
  producer = await startJobProducer(pools.server, () => {});
  authProducer = await startJobProducer(pools.auth, () => {});
  const recoveryDirectory = await mkdtemp(join(tmpdir(), "kairn-identity-replay-"));
  const recoveryJournal = new FileRestrictionJournal(recoveryDirectory, "v1", keys);
  // The snapshot retains an earlier recovery checkpoint. Carry its exact signed
  // history forward rather than substituting a fresh journal with a lower head.
  const retainedEntries = await journal.read();
  for (const entry of retainedEntries)
    expect(await recoveryJournal.append(entry.body, entry.eventSha256)).toEqual(entry);
  const accountEntry = retainedEntries.length;

  try {
    const actor = await provisionVerifiedAccount(pools.auth, subject, "After snapshot");
    const impact = await previewImpact(pools.server, actor, {
      action: "delete_account",
      journeyId: null,
      targetId: actor.accountId,
    });
    const deletion = await command(actor, {
      type: "account.delete",
      revision: 1,
      generation: 1,
      confirmDelete: "delete",
      statusReceiptHash: newStatusReceipt().hash,
      previewId: impact.previewId,
      previewSecretHash: impact.previewSecretHash,
    });
    await confirmRestriction(pools.worker, recoveryJournal, await eventFor(deletion.resourceId));
    const avatarId = randomUUID();
    const createId = randomUUID();
    const create = {
      type: "avatar.create",
      id: avatarId,
      contentType: "image/jpeg",
      bytes: 16,
      sha256: "b".repeat(64),
      bucket,
    } as const;
    await executeCommand(pools.server, avatarOwner, createId, create, producer, { fresh: true });
    const deletedAvatar = await command(avatarOwner, {
      type: "avatar.delete",
      id: avatarId,
      revision: 1,
    });
    await confirmRestriction(
      pools.worker,
      recoveryJournal,
      await eventFor(deletedAvatar.resourceId),
    );
    const deletedPresent = await command(avatarOwner, {
      type: "avatar.delete",
      id: presentId,
      revision: Number(present.revision),
    });
    await confirmRestriction(
      pools.worker,
      recoveryJournal,
      await eventFor(deletedPresent.resourceId),
    );
    const entries = await recoveryJournal.read();
    expect(JSON.parse(entries[accountEntry]!.body)).toMatchObject({
      version: 2,
      authSubjectId: subject,
      resourceId: actor.accountId,
    });
    await expect(
      pools.server.query("SELECT auth_subject_id FROM operations.restriction_event"),
    ).rejects.toMatchObject({ code: "42501" });
    // Cleanup cannot change the persisted signed binding used by a delivery retry.
    await pools.worker.query("SELECT operations.account_cleanup_unit($1)", [deletion.resourceId]);
    expect((await recoveryJournal.read())[accountEntry]).toEqual(entries[accountEntry]);
    await producer.stop();
    await authProducer.stop();
    await closePools();
    await admin.query("DROP DATABASE kairn WITH (FORCE)");
    await admin.query(
      "CREATE DATABASE kairn WITH TEMPLATE kairn_identity_snapshot OWNER kairn_migrator",
    );
    pools = makePools();
    const head = { sequence: entries.length, checkpointSha256: entries.at(-1)!.checkpointSha256 };
    await replayRestrictions(pools.owner, recoveryJournal, journalPublicKeys(keys), head);
    await replayRestrictions(pools.owner, recoveryJournal, journalPublicKeys(keys), head);
    expect(
      (
        await pools.owner.query("SELECT state,auth_subject_id FROM identity.account WHERE id=$1", [
          actor.accountId,
        ])
      ).rows[0],
    ).toMatchObject({ state: "deleting", auth_subject_id: subject });
    expect(
      (
        await pools.owner.query(
          "SELECT account_id FROM identity.retired_auth_subject WHERE auth_subject_id=$1",
          [subject],
        )
      ).rows[0]?.account_id,
    ).toBe(actor.accountId);
    await expect(
      provisionVerifiedAccount(pools.auth, subject, "Cannot reprovision"),
    ).rejects.toThrow();
    producer = await startJobProducer(pools.server, () => {});
    authProducer = await startJobProducer(pools.auth, () => {});
    await expect(
      executeCommand(pools.server, avatarOwner, createId, create, producer, { fresh: true }),
    ).rejects.toThrow();
    expect(
      (await pools.owner.query("SELECT id FROM identity.profile_avatar WHERE id=$1", [avatarId]))
        .rows,
    ).toEqual([]);
    expect(
      (
        await pools.worker.query("SELECT operations.avatar_target($1,'process') AS target", [
          avatarId,
        ])
      ).rows[0]?.target,
    ).toBeNull();
    expect(
      (
        await pools.worker.query(
          "SELECT operations.complete_avatar($1,1,$2,$3,$4,16,1,1,1,1) AS activated",
          [avatarId, bucket, `avatars/${avatarOwner.accountId}/${avatarId}.jpg`, "b".repeat(64)],
        )
      ).rows[0]?.activated,
    ).toBe(false);
    await expect(
      runAsAccount(pools.server, avatarOwner, (tx) =>
        tx.execute(`SELECT operations.avatar_target('${avatarId}','upload') AS target`),
      ),
    ).resolves.toMatchObject({ rows: [{ target: null }] });
    expect(await readAvatar(pools.server, avatarOwner, storage)).toBeNull();
    await processAvatar(pools.worker, presentId, storage);
    expect(
      (
        await pools.worker.query(
          "SELECT operations.complete_avatar($1,$2,$3,$4,$5,16,1,1,1,1) AS activated",
          [
            presentId,
            present.revision,
            bucket,
            present.representation_key,
            present.representation_sha256,
          ],
        )
      ).rows[0]?.activated,
    ).toBe(false);
    expect(
      (
        await pools.owner.query("SELECT state FROM identity.profile_avatar WHERE id=$1", [
          presentId,
        ])
      ).rows[0]?.state,
    ).toBe("deleting");
    // Existing legacy signed entries still replay when the exact binding survives.
    const legacy = JSON.parse(entries[accountEntry]!.body);
    delete legacy.version;
    delete legacy.authSubjectId;
    legacy.id = randomUUID();
    const body = JSON.stringify(legacy);
    await recoveryJournal.append(body, sha256(body));
    const withLegacy = await recoveryJournal.read();
    const legacyHead = {
      sequence: withLegacy.length,
      checkpointSha256: withLegacy.at(-1)!.checkpointSha256,
    };
    expect(verifyJournal(withLegacy, journalPublicKeys(keys)).at(-1)?.body).toBe(body);
    await replayRestrictions(pools.owner, recoveryJournal, journalPublicKeys(keys), legacyHead);
    const unknown = JSON.stringify({
      ...legacy,
      id: randomUUID(),
      resourceId: randomUUID(),
      accountId: null,
    });
    await recoveryJournal.append(unknown, sha256(unknown));
    const incomplete = await recoveryJournal.read();
    await expect(
      replayRestrictions(pools.owner, recoveryJournal, journalPublicKeys(keys), {
        sequence: incomplete.length,
        checkpointSha256: incomplete.at(-1)!.checkpointSha256,
      }),
    ).rejects.toThrow("fenced");
    expect(
      Number(
        (await pools.owner.query("SELECT sequence FROM operations.recovery_checkpoint WHERE id=1"))
          .rows[0]?.sequence,
      ),
    ).toBe(legacyHead.sequence);
    await expect(
      pools.owner.query("SELECT operations.replay_restriction($1::jsonb,$2,$3)", [
        JSON.stringify({ ...legacy, version: 2, authSubjectId: avatarOwner.subject }),
        legacyHead.sequence + 1,
        "f".repeat(64),
      ]),
    ).rejects.toMatchObject({ code: "23514" });
    await pools.worker.query("SELECT operations.account_cleanup_unit($1)", [actor.accountId]);
    await pools.worker.query("SELECT operations.account_cleanup_unit($1)", [actor.accountId]);
    expect(
      (await pools.owner.query('SELECT id FROM authn."user" WHERE id=$1', [subject])).rows,
    ).toEqual([]);
  } finally {
    await admin.query("DROP DATABASE kairn_identity_snapshot");
    await rm(recoveryDirectory, { recursive: true, force: true });
  }
});
