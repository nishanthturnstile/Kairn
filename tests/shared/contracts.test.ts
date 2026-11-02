import { describe, expect, it } from "vite-plus/test";
import { SystemStatusSchema } from "@kairn/contracts";
import { createApiClient } from "@kairn/contracts/client";
import {
  SYNC_PROTOCOL_VERSION,
  createCommandEnvelopeSchema,
  createResultEnvelopeSchema,
} from "@kairn/sync-protocol";

const status = { contractVersion: 1, syncProtocolVersion: SYNC_PROTOCOL_VERSION, status: "ok" };
const commandId = "b039656c-f32c-4eec-8756-328de4feb8c0";
const Command = createCommandEnvelopeSchema("fixture.status", SystemStatusSchema);
const Result = createResultEnvelopeSchema(SystemStatusSchema);

describe("status wire boundary", () => {
  it("loads the full compiled schema export after universal schemas initialized", async () => {
    const { createOpenAPIDocument } = await import("@kairn/contracts/schema");
    const document = createOpenAPIDocument();
    expect(document.paths?.["/api/v1/system"]?.get?.operationId).toBe("getSystemStatus");
    expect(SystemStatusSchema.safeParse({ ...status, privateValue: "hidden" }).success).toBe(false);
  });
  it("validates a response delivered by the explicit generated client transport", async () => {
    const requests: string[] = [];
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetch: async (request) => {
        requests.push(`${request.method} ${request.url}`);
        return Response.json(status);
      },
    });
    const { data, error } = await client.GET("/api/v1/system");
    expect(error).toBeUndefined();
    expect(SystemStatusSchema.parse(data)).toEqual(status);
    expect(requests).toEqual(["GET https://api.example.test/api/v1/system"]);
  });

  it("keeps service errors separate from successful data", async () => {
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetch: async () =>
        Response.json({ code: "internal_error", message: "Service unavailable" }, { status: 500 }),
    });
    const response = await client.GET("/api/v1/system");
    expect(response.data).toBeUndefined();
    expect(response.error?.code).toBe("internal_error");
  });

  it.each([
    { ...status, contractVersion: 2 },
    { ...status, syncProtocolVersion: 0 },
    { ...status, status: "ready" },
    { ...status, journeyTitle: "Private fixture" },
  ])("rejects invalid or extra status bytes: %j", (value) => {
    expect(SystemStatusSchema.safeParse(value).success).toBe(false);
  });

  it.each([
    "/relative",
    "file:///tmp/api",
    "https://user:password@example.test",
    "https://example.test?token=secret",
    "https://example.test#fragment",
  ])("rejects an invalid API base URL: %s", (baseUrl) => {
    expect(() => createApiClient({ baseUrl, fetch: async () => Response.json(status) })).toThrow();
  });
});

describe("versioned sync envelopes", () => {
  it("preserves the persisted command ID across serialization and retry", () => {
    const command = { protocolVersion: 1, commandId, command: "fixture.status", payload: status };
    expect(Command.parse(JSON.parse(JSON.stringify(command)))).toEqual(command);
    expect(Command.parse(command).commandId).toBe(Command.parse(command).commandId);
  });

  it.each([
    { protocolVersion: 2, commandId, command: "fixture.status", payload: status },
    { protocolVersion: 1, commandId: "", command: "fixture.status", payload: status },
    { protocolVersion: 1, commandId, command: "unknown", payload: status },
    {
      protocolVersion: 1,
      commandId,
      command: "fixture.status",
      payload: { ...status, status: "invalid" },
    },
    {
      protocolVersion: 1,
      commandId,
      command: "fixture.status",
      payload: status,
      actorId: "untrusted",
    },
  ])("rejects unsupported, malformed, or widened commands: %j", (value) => {
    expect(Command.safeParse(value).success).toBe(false);
  });

  it("requires either an accepted result or a safe rejection, never both", () => {
    const identity = { protocolVersion: 1, commandId };
    const error = { code: "invalid_request", message: "Invalid command" };
    expect(Result.parse({ ...identity, status: "accepted", result: status }).status).toBe(
      "accepted",
    );
    expect(Result.parse({ ...identity, status: "rejected", error }).status).toBe("rejected");
    expect(
      Result.safeParse({ ...identity, status: "accepted", result: status, error }).success,
    ).toBe(false);
    expect(Result.safeParse({ ...identity, status: "rejected" }).success).toBe(false);
  });
});
