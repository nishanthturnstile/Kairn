// Generation/server registration only. Client entry points never import this module.
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { ApiErrorSchema, CONTRACT_VERSION, SYSTEM_PATH, SystemStatusSchema } from "./schemas.js";

export const systemRoute = createRoute({
  method: "get",
  path: SYSTEM_PATH,
  operationId: "getSystemStatus",
  summary: "Read setup contract and protocol status",
  responses: {
    200: {
      description: "Service status; contains no journey or account information.",
      // Cloning after the Hono extension loads preserves validation when shared chunks
      // initialized the universal schemas before OpenAPI's Zod extension.
      content: {
        "application/json": { schema: SystemStatusSchema.clone().openapi("SystemStatus") },
      },
    },
    500: {
      description: "Safe service error.",
      content: { "application/json": { schema: ApiErrorSchema.clone().openapi("ApiError") } },
    },
  },
});

export function createOpenAPIDocument(): ReturnType<OpenAPIHono["getOpenAPI31Document"]> {
  // Register descriptors without handlers, a process entry, sockets, or environment reads.
  const registry = new OpenAPIHono();
  registry.openAPIRegistry.registerPath(systemRoute);
  return registry.getOpenAPI31Document({
    openapi: "3.1.0",
    info: { title: "Kairn API", version: String(CONTRACT_VERSION) },
  });
}
