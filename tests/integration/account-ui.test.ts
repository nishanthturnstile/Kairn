import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { afterAll, beforeAll, expect, it } from "vite-plus/test";
import { chromium, expect as check, type Browser } from "@playwright/test";
import { MyAccountSchema } from "@kairn/contracts";

let browser: Browser;
let server: Server;
let origin: string;
beforeAll(async () => {
  // Test the actual built client, isolated from production APIs and account state.
  const root = resolve("apps/web/dist/client");
  server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    const asset = /^\/assets\/[\w.-]+$/.test(url.pathname);
    if (url.pathname.startsWith("/api/")) {
      response.writeHead(503);
      response.end();
      return;
    }
    try {
      const file = resolve(root, asset ? url.pathname.slice(1) : "index.html");
      const content = await readFile(file);
      const types: Record<string, string> = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".woff2": "font/woff2",
      };
      response.setHeader(
        "Content-Type",
        asset ? types[extname(file)] || "application/octet-stream" : "text/html",
      );
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test server address");
  origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch(process.platform === "win32" ? { channel: "msedge" } : {});
});
afterAll(async () => {
  await browser?.close();
  await new Promise<void>((done) => server?.close(() => done()));
});

it("keeps the real profile form submitting through the canonical button", async () => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const account = MyAccountSchema.parse({
      accountId: "019a5500-0000-7000-8000-000000000001",
      accountRevision: 1,
      etag: '"account-1"',
      state: "active",
      emailVerified: true,
      privateEmail: "account@example.test",
      profile: { displayName: "Sample traveler", bio: "", revision: 1, etag: '"profile-1"' },
    });
    await page.route("**/api/v1/me", (route) => route.fulfill({ json: account }));
    await page.route("**/api/v1/me/avatar/status", (route) =>
      route.fulfill({ json: { state: "absent" } }),
    );
    await page.route("**/api/auth/list-sessions", (route) => route.fulfill({ json: [] }));
    let attempted = false;
    await page.route("**/api/v1/me/profile", async (route) => {
      attempted = true;
      expect(route.request().method()).toBe("PATCH");
      expect(route.request().headers()["if-match"]).toBe(account.profile.etag);
      // A rejected real form submission must retain the attempted draft.
      await route.fulfill({ status: 412, json: { code: "revision_conflict" } });
    });
    await page.goto(`${origin}/account`);
    await page.getByLabel("Display name", { exact: true }).fill("Retained after conflict");
    await page.getByRole("button", { name: "Save profile", exact: true }).click();
    await check(
      page.getByText(
        "Your profile changed elsewhere. Reload the saved profile before trying again.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(attempted).toBe(true);
    await check(page.getByLabel("Display name", { exact: true })).toHaveValue(
      "Retained after conflict",
    );
    // This is UI/transport-contract coverage; it does not qualify the real account service.
  } finally {
    await context.close();
  }
});
