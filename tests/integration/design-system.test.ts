import { createServer, type Server } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { afterAll, beforeAll, expect, it } from "vite-plus/test";
import { chromium, expect as check, type Browser } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { MyAccountSchema } from "@kairn/contracts";

let browser: Browser;
let server: Server;
let origin: string;
const evidence = ".kairn/verification/design-system";
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
  await mkdir(evidence, { recursive: true });
});
afterAll(async () => {
  await browser?.close();
  await new Promise<void>((done) => server?.close(() => done()));
});

it("retains drafts, guards pending activation, supports keyboard choices and restores dialog focus", async () => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    const errors: string[] = [];
    const writes: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.method() !== "GET") writes.push(request.url());
    });
    await page.goto(`${origin}/prototype/components`);
    await check(page.getByRole("heading", { name: "The details belong together." })).toBeVisible();
    const title = page.getByLabel("Journey title", { exact: true });
    await title.fill("A retained journey title");
    await page.getByRole("button", { name: "Show error example", exact: true }).click();
    await check(title).toHaveValue("A retained journey title");
    await check(title).toHaveAttribute("aria-invalid", "true");
    const help = await title.getAttribute("aria-describedby");
    expect(help).toBeTruthy();
    expect(
      await page.evaluate((id) => document.getElementById(id || "")?.textContent, help),
    ).toContain("Your title is retained");
    const save = page.getByRole("button", { name: "Save sample", exact: true });
    await save.click();
    await check(save).toBeDisabled();
    await check(save).toHaveAttribute("aria-busy", "true");
    await check(save).toHaveText("Save sample");
    await page.getByRole("button", { name: "Clear pending example" }).click();
    await check(save).toBeEnabled();
    const story = page.getByRole("radio", { name: "Story", exact: true });
    await story.focus();
    await page.keyboard.press("ArrowRight");
    await check(page.getByRole("radio", { name: "Explore", exact: true })).toBeChecked();
    await check(title).toHaveValue("A retained journey title");
    const trigger = page.getByRole("button", { name: "Inspect withdrawal impact" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Withdraw this source?" });
    await check(dialog).toBeVisible();
    await check(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    for (let index = 0; index < 4; index++) await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await check(dialog).not.toBeVisible();
    await check(trigger).toBeFocused();
    const appearance = page.getByLabel("Appearance", { exact: true }).last();
    await appearance.selectOption("dark");
    await check(page.locator("html")).toHaveAttribute("data-appearance", "dark");
    await check(title).toHaveValue("A retained journey title");
    await page.reload();
    await check(page.locator("html")).toHaveAttribute("data-appearance", "dark");
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
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
      privateEmail: "specimen@example.test",
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

it("keeps catalogs and reader usable across appearances, narrow layouts and text growth", async () => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const results: unknown[] = [];
  try {
    const page = await context.newPage();
    for (const appearance of ["light", "dark"]) {
      await page.addInitScript(
        (value) => localStorage.setItem("kairn.appearance", value),
        appearance,
      );
      for (const width of [320, 390, 820, 1440]) {
        await page.setViewportSize({ width, height: 960 });
        await page.goto(`${origin}/prototype/components`);
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        );
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        const targets = await page
          .locator("button:not(:disabled):visible")
          .evaluateAll((elements) =>
            elements
              .map((element) => ({
                label: element.textContent,
                rect: element.getBoundingClientRect().toJSON(),
              }))
              .filter((item) => item.rect.height < 44 || item.rect.width < 44),
          );
        results.push({
          surface: "catalog",
          appearance,
          width,
          overflow,
          targets,
          violations: axe.violations.map((item) => ({
            id: item.id,
            impact: item.impact,
            nodes: item.nodes.map((node) => node.target),
          })),
        });
        await page.screenshot({
          path: `${evidence}/catalog-${appearance}-${width}.png`,
          fullPage: true,
        });
        expect(overflow).toBe(false);
        expect(targets).toEqual([]);
        expect(axe.violations).toEqual([]);
      }
    }
    await page.setViewportSize({ width: 390, height: 960 });
    await page.goto(`${origin}/prototype/reader`);
    await page.evaluate(() => document.fonts.ready);
    await check(page.locator(".atlas-map")).toHaveCount(0);
    await page.locator(".atlas-chapter").nth(2).click();
    await page.getByRole("radio", { name: "Explore", exact: true }).check();
    await page.getByRole("button", { name: "Open route context", exact: true }).click();
    await check(page.locator(".atlas-map")).toContainText("No connecting route inferred");
    await page.getByRole("radio", { name: "Learn", exact: true }).check();
    await page.getByLabel("Find practical details").selectOption("Costs");
    await page.getByRole("button", { name: "Read source chapter", exact: true }).click();
    await check(page.locator(".atlas-reading h2")).toHaveText("Above the morning cloud");
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({ path: `${evidence}/reader-dark-390.png`, fullPage: true });
    await page.goto(`${origin}/prototype/components`);
    await page.setViewportSize({ width: 820, height: 960 });
    await page.addStyleTag({ content: ":root { zoom: 2; }" });
    await page.screenshot({ path: `${evidence}/catalog-text-growth.png`, fullPage: true });
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.right > innerWidth + 1;
        })
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          text: element.textContent?.slice(0, 80),
        })),
    );
    expect(overflow).toEqual([]);
  } finally {
    await writeFile(`${evidence}/browser.json`, JSON.stringify(results, null, 2));
    await context.close();
  }
});
