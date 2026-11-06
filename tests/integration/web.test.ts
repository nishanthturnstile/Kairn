import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { chromium, expect as browserExpect, type Browser } from "@playwright/test";
import { SystemStatusSchema } from "@kairn/contracts";
import { createApiClient } from "@kairn/contracts/client";
import { tokens } from "@kairn/design-tokens";

function cssColor(hex: string) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return `rgb(${(value >> 16) & 0xff}, ${(value >> 8) & 0xff}, ${value & 0xff})`;
}

const baseUrl = process.env.TEST_BASE_URL;
if (!baseUrl) throw new Error("TEST_BASE_URL must point at the composed application ingress.");
const mode = process.env.TEST_WEB_MODE;
if (mode !== "development" && mode !== "runtime")
  throw new Error("TEST_WEB_MODE must explicitly select development or runtime delivery.");
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
});

describe("composed server/web boundary", () => {
  it("delivers a typed API, liveness, and readiness through ingress", async () => {
    const client = createApiClient({ baseUrl, fetch: (request) => fetch(request) });
    const response = await client.GET("/api/v1/system");
    expect(SystemStatusSchema.parse(response.data).status).toBe("ok");
    for (const path of ["/health/live", "/health/ready"])
      expect((await fetch(`${baseUrl}${path}`)).ok).toBe(true);
  });

  it("serves complete SSR text with independent overlapping request markers", async () => {
    const markers = ["FIRST_REQUEST_ONLY", "SECOND_REQUEST_ONLY", "THIRD_REQUEST_ONLY"];
    const responses = await Promise.all(
      markers.map((marker) =>
        fetch(`${baseUrl}/setup/reader?marker=${marker}`).then((response) => response.text()),
      ),
    );
    for (const [index, html] of responses.entries()) {
      expect(html).toContain("<title>Kairn setup reader</title>");
      expect(html).toContain("A quiet page, ready to read.");
      expect(html).toContain(markers[index]);
      for (const other of markers.filter((_, position) => position !== index))
        expect(html).not.toContain(other);
    }
  });

  it("hydrates the same reader, loads lazy status assets, and renders safe serialized data", async () => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const errors: string[] = [];
      const requests: string[] = [];
      let hmrConnected = false;
      page.on("websocket", (socket) =>
        socket.on("framereceived", ({ payload }) => {
          if (String(payload).includes('"type":"connected"')) hmrConnected = true;
        }),
      );
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("request", (request) => requests.push(request.url()));
      const marker = '</script><img src=x onerror="window.fixtureAttack=true"> & \u2028';
      await page.goto(`${baseUrl}/setup/reader?marker=${encodeURIComponent(marker)}`);
      await browserExpect(page).toHaveTitle("Kairn setup reader");
      await browserExpect(page.getByTestId("request-marker")).toHaveText(marker);
      await browserExpect(
        page.getByRole("button", { name: "Mark as read", exact: true }),
      ).toHaveCSS("background-color", cssColor(tokens.color.forest800));
      if (await page.locator('script[src="/@vite/client"]').count()) {
        await browserExpect.poll(() => hmrConnected).toBe(true);
      }
      await page.getByRole("button", { name: "Mark as read", exact: true }).click();
      await browserExpect(page.getByRole("button", { name: "Marked as read" })).toBeDisabled();
      const before = requests.length;
      await page.getByRole("button", { name: "Check service status" }).click();
      await browserExpect(page.getByRole("status")).toContainText("Service online");
      expect(requests.slice(before).some((url) => url.includes("ReaderDetails"))).toBe(true);
      expect(await page.evaluate(() => Object.hasOwn(window, "fixtureAttack"))).toBe(false);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });

  it("navigates creator routes and reads the generated status client", async () => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(baseUrl);
      await browserExpect(
        page.getByRole("heading", { name: "A place for the journey." }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Connection status", exact: true }).click();
      await browserExpect(page.getByRole("status")).toContainText("Service online");
      await page.reload();
      await browserExpect(page.getByRole("status")).toContainText("Service online");
    } finally {
      await context.close();
    }
  });

  it("does not deliver private files, source maps, traversal paths, or public journeys", async () => {
    for (const path of [
      "/.env",
      "/package.json",
      "/node_modules/vite/package.json",
      "/assets/../../package.json",
      "/assets/%2e%2e/%2e%2e/package.json",
      "/assets/missing.js.map",
      "/journeys/private-id",
    ]) {
      const response = await fetch(`${baseUrl}${path}`);
      expect(response.status, path).toBe(404);
    }
    const response = await fetch(`${baseUrl}/api/v1/system`, {
      headers: { Origin: "https://untrusted.example" },
    });
    expect(response.status).toBe(403);
    const allowed = await fetch(`${baseUrl}/api/v1/system`, {
      headers: { Origin: process.env.TEST_PUBLIC_ORIGIN ?? new URL(baseUrl).origin },
    });
    expect(allowed.status).toBe(200);
  });
});
