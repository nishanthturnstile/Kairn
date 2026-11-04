import { createServer } from "node:https";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vite-plus/test";
import { chromium, expect as browserExpect, type Browser } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { createDatabasePool, readDatabaseUrl } from "@kairn/backend/database";
import { processAvatar, PrivateIdentityStorage } from "@kairn/backend/media";
import { createMailTransport, deliverEmail } from "@kairn/backend/mail";
import {
  createApp,
  createProductionWeb,
  loadAccountRuntime,
  createNodeRequestListener,
} from "@kairn/server/app";

if (process.env.TEST_DOMAIN_ISOLATED !== "1") throw new Error("Use pnpm verify:accounts.");
const pools = {
  owner: createDatabasePool(
    readDatabaseUrl(process.env.TEST_MIGRATION_DATABASE_URL),
    "accounts-test-owner",
    1,
  ),
  server: createDatabasePool(
    readDatabaseUrl(process.env.TEST_SERVER_DATABASE_URL),
    "accounts-test-api",
    2,
  ),
  worker: createDatabasePool(
    readDatabaseUrl(process.env.TEST_WORKER_DATABASE_URL),
    "accounts-test-worker",
    1,
  ),
};
let browser: Browser;
let server: ReturnType<typeof createServer>;
let runtime: Awaited<ReturnType<typeof loadAccountRuntime>>;
let folder: string;
const origin = "https://localhost:3443";
const mailKey = randomBytes(32);
const recipientKey = randomBytes(32);
let avatarBucket: string;
const transport = createMailTransport({
  host: process.env.TEST_SMTP_HOST!,
  port: 1025,
  secure: false,
  localFixture: true,
});
const storage = new S3Client({
  endpoint: process.env.TEST_STORAGE_ENDPOINT!,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.TEST_STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.TEST_STORAGE_SECRET_KEY!,
  },
});
beforeAll(async () => {
  // The wrapper owns a disposable marked database, never the live checkout stack.
  const marker = await pools.owner.query(
    "SELECT current_setting('kairn.test_project',true) AS project",
  );
  if (marker.rows[0]?.project !== process.env.TEST_DOMAIN_TEST_PROJECT)
    throw new Error("Disposable project marker missing.");
  // Use the production migrator/bootstrap including real queue provisioning.
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  await promisify(execFile)(process.execPath, ["packages/backend/dist/bootstrap.js"], {
    env: { ...process.env, MIGRATION_DATABASE_URL: process.env.TEST_MIGRATION_DATABASE_URL! },
  });
  folder = await mkdtemp(join(tmpdir(), "kairn-accounts-"));
  const bucket = `kairn-account-${randomUUID()}`;
  avatarBucket = bucket;
  await storage.send(new CreateBucketCommand({ Bucket: bucket }));
  const config = join(folder, "account.json");
  await writeFile(
    config,
    JSON.stringify({
      authDatabaseUrl: process.env.TEST_AUTH_DATABASE_URL,
      secret: randomBytes(32).toString("base64url"),
      abuseKey: randomBytes(32).toString("base64url"),
      trustedProxyCidrs: [],
      mail: {
        keyId: "v1",
        key: mailKey.toString("base64url"),
        recipientKey: recipientKey.toString("base64url"),
      },
      storage: {
        endpoint: process.env.TEST_STORAGE_ENDPOINT,
        bucket,
        accessKey: process.env.TEST_STORAGE_ACCESS_KEY,
        secretKey: process.env.TEST_STORAGE_SECRET_KEY,
      },
    }),
    { mode: 0o600 },
  );
  runtime = await loadAccountRuntime(config, origin, pools.server);
  if (!runtime) throw new Error("Runtime did not load.");
  await runtime.checkReady();
  const app = createApp({
    web: await createProductionWeb(),
    publicOrigin: origin,
    accounts: runtime.accounts,
  });
  server = createServer(
    {
      key: await readFile("tests/fixtures/identity/journal-test-key.pem"),
      cert: await readFile("tests/fixtures/identity/journal-test-cert.pem"),
    },
    createNodeRequestListener(app, runtime),
  );
  await new Promise<void>((resolve) => server.listen(3443, "127.0.0.1", resolve));
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  await runtime?.close();
  await Promise.all(Object.values(pools).map((pool) => pool.end()));
  storage.destroy();
  transport.close();
  if (folder) await rm(folder, { recursive: true, force: true });
});
async function mailLink(email: string, purpose: string) {
  const row = (
    await pools.owner.query(
      'SELECT d.id FROM operations.email_delivery d JOIN authn."user" u ON u.id=d.auth_subject_id WHERE u.email=$1 AND d.purpose=$2 ORDER BY d.created_at DESC LIMIT 1',
      [email, purpose],
    )
  ).rows[0];
  expect(row).toBeTruthy();
  await deliverEmail(pools.worker, row.id, {
    origin: new URL(origin),
    keys: new Map([["v1", mailKey]]),
    recipientKey,
    from: "kairn@kairn.invalid",
    transport,
  });
  const inbox = await (await fetch(`${process.env.TEST_MAILPIT_URL}/api/v1/messages`)).json();
  const message = inbox.messages.find((entry: { To: { Address: string }[] }) =>
    entry.To.some((to) => to.Address === email),
  );
  const contents = await (
    await fetch(`${process.env.TEST_MAILPIT_URL}/api/v1/message/${message.ID}`)
  ).json();
  return contents.Text.match(/https:\/\/[^\s]+/)[0] as string;
}
it("completes real secure-cookie creation, verification, profile/export, sessions and recovery in the packaged web UI", async () => {
  // Fixture-only self-signed TLS is explicitly trusted by this isolated browser.
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const email = `${randomUUID()}@kairn.invalid`;
  const password = `A field passphrase ${randomUUID()}`;
  try {
    await page.goto(`${origin}/create-account`);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await browserExpect(page.getByLabel("Display name", { exact: true })).toBeFocused();
    await page.getByLabel("Display name", { exact: true }).fill("Field Companion");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Show password", exact: true }).click();
    await browserExpect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "type",
      "text",
    );
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await browserExpect(page.getByRole("status")).toContainText("Check your email");
    await page.goto(await mailLink(email, "verification"));
    await page.goto(`${origin}/sign-in`);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await browserExpect(
      page.getByRole("heading", { name: "Private profile", exact: true }),
    ).toBeVisible();
    expect((await context.cookies()).some((cookie) => cookie.httpOnly && cookie.secure)).toBe(true);
    let loseSave = true;
    await page.route("**/api/v1/me/profile", async (route) => {
      if (loseSave) {
        loseSave = false;
        expect((await route.fetch()).ok()).toBe(true);
        await route.abort("connectionfailed");
      } else await route.continue();
    });
    await page.getByLabel("Bio (optional)").fill("A private field note");
    await page.getByRole("button", { name: "Save profile", exact: true }).click();
    await browserExpect(page.getByRole("status")).toBeVisible();
    await browserExpect(page.getByLabel("Bio (optional)")).toHaveValue("A private field note");
    await page.getByRole("button", { name: "Save profile", exact: true }).click();
    await browserExpect(page.getByRole("status")).toContainText("Profile saved");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download account data" }).click();
    const saved = await download;
    const downloaded = await readFile((await saved.path())!, "utf8");
    expect(JSON.parse(downloaded).account.profile.bio).toBe("A private field note");
    expect(downloaded).not.toMatch(/session_token|quarantine_key/);
    for (const width of [390, 820, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: `test-results/accounts/profile-${width}.png`, fullPage: true });
    }
    // The server commits completion, then the connection loses its response.
    let loseCompletion = true;
    let byteWrites = 0;
    let uploadId = "";
    await page.route("**/api/v1/me/avatar/uploads/*/bytes", async (route) => {
      byteWrites++;
      await route.continue();
    });
    await page.route("**/api/v1/me/avatar/uploads/*/complete", async (route) => {
      uploadId = route.request().url().split("/").at(-2)!;
      if (loseCompletion) {
        loseCompletion = false;
        const response = await route.fetch();
        expect(response.ok()).toBe(true);
        await route.abort("connectionfailed");
      } else await route.continue();
    });
    await page
      .getByLabel("Choose a JPEG or PNG (up to 5 MiB)")
      .setInputFiles("tests/fixtures/identity/avatar-metadata.png");
    await browserExpect(page.getByRole("button", { name: "Retry avatar upload" })).toBeVisible();
    await page.getByRole("button", { name: "Retry avatar upload" }).click();
    await browserExpect(page.getByRole("status").first()).toContainText("Avatar uploaded");
    expect(byteWrites).toBe(1);
    await processAvatar(pools.worker, uploadId, new PrivateIdentityStorage(storage, avatarBucket));
    await page.getByRole("button", { name: "Refresh avatar status" }).click();
    await browserExpect(page.getByRole("img", { name: "Your private avatar" })).toBeVisible();
    await page.getByRole("button", { name: "Remove avatar", exact: true }).click();
    await browserExpect(page.getByRole("status").first()).toContainText("Avatar removed");
    const companionTab = await context.newPage();
    await companionTab.goto(`${origin}/account`);
    await browserExpect(
      companionTab.getByRole("heading", { name: "Private profile", exact: true }),
    ).toBeVisible();
    let releaseLate = async () => {};
    let markHeld = () => {};
    const held = new Promise<void>((resolve) => {
      markHeld = resolve;
    });
    let interceptOldAccount = true;
    await companionTab.route("**/api/v1/me", async (route) => {
      if (!interceptOldAccount) {
        await route.continue();
        return;
      }
      interceptOldAccount = false;
      const response = await route.fetch();
      releaseLate = async () => {
        await route.fulfill({ response }).catch(() => {});
      };
      markHeld();
    });
    await companionTab.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
    await held;
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await browserExpect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
    await browserExpect(page.getByText(email, { exact: true })).toHaveCount(0);
    await browserExpect(
      companionTab.getByRole("heading", { name: "Private profile", exact: true }),
    ).toHaveCount(0);
    await browserExpect(companionTab.getByText(email, { exact: true })).toHaveCount(0);

    const secondEmail = `${randomUUID()}@kairn.invalid`;
    const registration = await context.request.post(`${origin}/api/auth/sign-up/email`, {
      headers: { Origin: origin },
      data: {
        name: "Second Companion",
        email: secondEmail,
        password,
        callbackURL: `${origin}/verify-email`,
      },
    });
    expect(registration.ok()).toBe(true);
    await page.goto(await mailLink(secondEmail, "verification"));
    await page.goto(`${origin}/sign-in`);
    await page.getByLabel("Email", { exact: true }).fill(secondEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await browserExpect(companionTab.getByText(secondEmail, { exact: true })).toBeVisible();
    await releaseLate();
    await browserExpect(companionTab.getByText(email, { exact: true })).toHaveCount(0);
    await browserExpect(companionTab.getByLabel("Bio (optional)")).toHaveValue("");
    const activeSessions = await (
      await context.request.get(`${origin}/api/auth/list-sessions`)
    ).json();
    const revoked = await context.request.post(`${origin}/api/auth/revoke-session`, {
      headers: { Origin: origin },
      data: {
        sessionId: activeSessions.find((session: { current: boolean }) => session.current).id,
      },
    });
    expect(revoked.ok()).toBe(true);
    await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
    await companionTab.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
    await browserExpect(
      page.getByRole("heading", { name: "Private profile", exact: true }),
    ).toHaveCount(0);
    await browserExpect(companionTab.getByText(secondEmail, { exact: true })).toHaveCount(0);

    await pools.owner.query("DELETE FROM operations.abuse_counter WHERE operation='auth_mail'");
    await page.goto(`${origin}/recover`);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByRole("button", { name: "Send reset email" }).click();
    await browserExpect(page.getByRole("status")).toContainText("reset email");
    await page.goto(await mailLink(email, "password_reset"));
    const replacement = `Another field phrase ${randomUUID()}`;
    await page.getByLabel("New password", { exact: true }).fill(replacement);
    await page.getByRole("button", { name: "Save new password" }).click();
    await browserExpect(page.getByRole("status")).toContainText("Password updated");
    expect(page.url()).toBe(`${origin}/reset-password`);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
