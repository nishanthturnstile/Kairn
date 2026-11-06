import { describe, expect, it } from "vite-plus/test";
import { createApp } from "@kairn/server/app";
import { SystemStatusSchema } from "@kairn/contracts";

const publicOrigin = "https://kairn.example.test";
const web = {
  creator: async () => "<h1>Creator fixture</h1>",
  reader: async (data: { marker: string }) => data.marker,
  asset: async () => null,
};

describe("HTTP factory without a listener", () => {
  it("returns the actual versioned contract and separate readiness", async () => {
    const app = createApp({ web, publicOrigin });
    const response = await app.request("/api/v1/system");
    expect(response.status).toBe(200);
    expect(SystemStatusSchema.parse(await response.json())).toEqual({
      contractVersion: 1,
      syncProtocolVersion: 1,
      status: "ok",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect((await app.request("/health/ready")).status).toBe(200);
  });
  it("allows only the configured browser origin", async () => {
    const app = createApp({ web, publicOrigin });
    expect(
      (await app.request("/api/v1/system", { headers: { Origin: "https://untrusted.example" } }))
        .status,
    ).toBe(403);
    const response = await app.request("/api/v1/system", { headers: { Origin: publicOrigin } });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(publicOrigin);
  });
  it("keeps concurrent fixture data request-local", async () => {
    const app = createApp({
      publicOrigin,
      web: {
        ...web,
        reader: async (data) => {
          await Promise.resolve();
          return data.marker;
        },
      },
    });
    const responses = await Promise.all(
      ["first", "second"].map(async (marker) => app.request(`/setup/reader?marker=${marker}`)),
    );
    expect(await Promise.all(responses.map((response) => response.text()))).toEqual([
      "first",
      "second",
    ]);
  });
  it("keeps public journeys and source paths unavailable", async () => {
    const app = createApp({ web, publicOrigin });
    for (const path of [
      "/journeys/private-id",
      "/src/app.ts",
      "/.env",
      "/package.json",
      "/setup/accounts",
      "/prototype",
      "/prototype/components",
      "/prototype/reader",
      "/api/v1/me",
      "/api/v1/journeys",
    ])
      expect((await app.request(path)).status).toBe(404);
  });
  it("returns safe error bytes when rendering fails", async () => {
    const app = createApp({
      publicOrigin,
      web: {
        ...web,
        reader: async () => {
          throw new Error("SERVER_SECRET_FIXTURE");
        },
      },
    });
    const response = await app.request("/setup/reader");
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("SERVER_SECRET_FIXTURE");
  });
});
