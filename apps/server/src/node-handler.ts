import { getRequestListener } from "@hono/node-server";
import type { createApp } from "./app.js";
import type { loadAccountRuntime } from "./accounts/runtime.js";

/** One socket-bound adapter for development, packaged serving and acceptance. */
export function createNodeFetch(
  app: ReturnType<typeof createApp>,
  runtime?: Awaited<ReturnType<typeof loadAccountRuntime>>,
) {
  return ((request, bindings) =>
    app.fetch(
      runtime?.prepare(request, bindings.incoming.socket.remoteAddress) ?? request,
      bindings,
    )) satisfies Parameters<typeof getRequestListener>[0];
}
export function createNodeRequestListener(
  app: ReturnType<typeof createApp>,
  runtime?: Awaited<ReturnType<typeof loadAccountRuntime>>,
) {
  return getRequestListener(createNodeFetch(app, runtime));
}
