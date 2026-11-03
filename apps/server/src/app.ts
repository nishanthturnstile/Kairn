import { OpenAPIHono } from "@hono/zod-openapi";
import { CONTRACT_VERSION, SystemStatusSchema } from "@kairn/contracts";
import { systemRoute } from "@kairn/contracts/schema";
import { SYNC_PROTOCOL_VERSION } from "@kairn/sync-protocol";

export type WebAdapter = {
  creator: (url: string) => Promise<string>;
  reader: (data: { marker: string }, url: string) => Promise<string>;
  asset: (pathname: string) => Promise<Response | null>;
};
export function createApp(options: {
  web: WebAdapter;
  publicOrigin: string;
  onError?: (error: Error) => void;
  checkReady?: () => Promise<void>;
}): OpenAPIHono {
  const app = new OpenAPIHono();
  app.use("*", async (context, next) => {
    context.header("X-Content-Type-Options", "nosniff");
    context.header("Referrer-Policy", "same-origin");
    await next();
  });
  app.use("/api/*", async (context, next) => {
    const origin = context.req.header("Origin");
    context.header("Cache-Control", "no-store");
    if (origin && origin !== options.publicOrigin)
      return context.json({ code: "invalid_request", message: "Origin is not permitted." }, 403);
    if (origin) {
      context.header("Access-Control-Allow-Origin", origin);
      context.header("Vary", "Origin");
    }
    if (context.req.method === "OPTIONS") {
      context.header("Access-Control-Allow-Methods", "GET, HEAD");
      return context.body(null, 204);
    }
    await next();
  });
  app.get("/health/live", (context) => context.json({ status: "ok" }));
  app.get("/health/ready", async (context) => {
    try {
      await options.checkReady?.();
      return context.json({ status: "ok" });
    } catch {
      return context.json({ status: "unavailable" }, 503);
    }
  });
  app.openapi(systemRoute, (context) =>
    context.json(
      SystemStatusSchema.parse({
        contractVersion: CONTRACT_VERSION,
        syncProtocolVersion: SYNC_PROTOCOL_VERSION,
        status: "ok",
      }),
      200,
    ),
  );
  app.get(
    "/assets/*",
    async (context) =>
      (await options.web.asset(new URL(context.req.url).pathname)) ?? context.notFound(),
  );
  app.get("/setup/reader", async (context) => {
    const marker = context.req.query("marker") ?? "A synthetic page for repository setup.";
    if (!marker.length || marker.length > 200) return context.text("Invalid fixture marker.", 400);
    context.header("Cache-Control", "no-store");
    context.header("X-Robots-Tag", "noindex, nofollow");
    return context.html(await options.web.reader({ marker }, context.req.url));
  });
  for (const path of ["/", "/setup/status", "/prototype", "/prototype/*"]) {
    app.get(path, async (context) => {
      context.header("Cache-Control", "no-store");
      return context.html(await options.web.creator(context.req.url));
    });
  }
  app.notFound((context) => context.text("This page is not available.", 404));
  app.onError((error, context) => {
    options.onError?.(error);
    return context.json({ code: "internal_error", message: "Service is unavailable." }, 500);
  });
  return app;
}
