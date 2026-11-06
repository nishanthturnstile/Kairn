import { OpenAPIHono } from "@hono/zod-openapi";
import { CONTRACT_VERSION, SystemStatusSchema, type MyAccount } from "@kairn/contracts";
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
  accounts?: {
    // Owning transport supplies the trusted connection/proxy identity. The app
    // factory never interprets a caller-controlled forwarded-IP header.
    handleAuth: (request: Request) => Promise<Response>;
    getMyAccount: (headers: Headers) => Promise<MyAccount | null>;
    handleDomain?: (request: Request) => Promise<Response>;
  };
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
    if (
      origin &&
      origin !== options.publicOrigin &&
      !(options.accounts && context.req.path.startsWith("/api/auth/") && origin === "kairn-dev://")
    )
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
  if (options.accounts) {
    const accounts = options.accounts;
    app.on(["GET", "POST"], "/api/auth/*", (context) => accounts.handleAuth(context.req.raw));
    if (accounts.handleDomain) {
      const handle = accounts.handleDomain;
      app.get("/api/v1/operations/:id", (context) => handle(context.req.raw));
      app.on(
        ["GET", "POST", "PATCH", "PUT", "DELETE"],
        [
          "/api/v1/me/profile",
          "/api/v1/me/export",
          "/api/v1/me/avatar",
          "/api/v1/me/avatar/status",
          "/api/v1/me/avatar/uploads",
          "/api/v1/me/avatar/uploads/:uploadId/bytes",
          "/api/v1/me/avatar/uploads/:uploadId/complete",
        ],
        (context) => handle(context.req.raw),
      );
    }
    app.get("/api/v1/me", async (context) => {
      const problem = (status: 401 | 503) =>
        context.json(
          {
            type: "about:blank",
            title: status === 401 ? "Sign in to continue." : "Account service is unavailable.",
            status,
            code:
              status === 401 ? ("session_required" as const) : ("dependency_unavailable" as const),
            requestId: crypto.randomUUID(),
          },
          status,
          { "Content-Type": "application/problem+json", "X-Kairn-Contract-Version": "1" },
        );
      try {
        const account = await accounts.getMyAccount(context.req.raw.headers);
        if (!account) return problem(401);
        context.header("ETag", account.etag);
        context.header("X-Kairn-Contract-Version", "1");
        return context.json(account);
      } catch {
        return problem(503);
      }
    });
  }
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
  for (const path of [
    "/",
    "/setup/status",
    ...(options.accounts
      ? ["/sign-in", "/create-account", "/recover", "/reset-password", "/verify-email", "/account"]
      : []),
  ]) {
    app.get(path, async (context) => {
      context.header("Cache-Control", "no-store");
      context.header("Referrer-Policy", "no-referrer");
      return context.html(
        (await options.web.creator(context.req.url)).replace(
          "<html",
          `<html data-accounts-enabled="${Boolean(options.accounts)}"`,
        ),
      );
    });
  }
  app.notFound((context) => context.text("This page is not available.", 404));
  app.onError((error, context) => {
    options.onError?.(error);
    return context.json({ code: "internal_error", message: "Service is unavailable." }, 500);
  });
  return app;
}

export { createProductionWeb } from "./production-web.js";
export { loadAccountRuntime } from "./accounts/runtime.js";

export { createNodeRequestListener } from "./node-handler.js";
