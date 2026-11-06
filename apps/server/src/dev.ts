import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer as createViteServer } from "vite";
import { z } from "zod";
import { createLogger } from "@kairn/backend";
import { checkDatabase, createDatabasePool, readDatabaseUrl } from "@kairn/backend/database";
import { createApp } from "./app.js";
import { loadAccountRuntime } from "./accounts/runtime.js";
import { createNodeRequestListener } from "./node-handler.js";
import { readServerEnvironment } from "./environment.js";
import { readerDocument } from "./document.js";

const environment = readServerEnvironment(process.env);
const logger = createLogger("server", environment);
const database = createDatabasePool(readDatabaseUrl(process.env.DATABASE_URL), "kairn-server-dev");
database.on("error", () =>
  logger.error({ code: "database_error" }, "Idle database connection failed"),
);
await checkDatabase(database);
const accountsRuntime = await loadAccountRuntime(
  process.env.KAIRN_ACCOUNTS_CONFIG,
  environment.publicOrigin,
  database,
);
const root = resolve(process.cwd(), "../web");
const server = createServer();
const vite = await createViteServer({
  root,
  configFile: resolve(root, "vite.config.ts"),
  server: {
    middlewareMode: true,
    hmr: { server },
    fs: {
      allow: [
        root,
        resolve(root, "../../node_modules"),
        ...["contracts", "shared", "sync-protocol", "design-tokens"].map((name) =>
          resolve(root, "../../packages", name, "dist"),
        ),
      ],
    },
  },
  appType: "custom",
});
const RenderedSchema = z.strictObject({ html: z.string(), title: z.string() });
const app = createApp({
  ...(accountsRuntime ? { accounts: accountsRuntime.accounts } : {}),
  checkReady: async () => {
    await checkDatabase(database);
    await accountsRuntime?.checkReady();
  },
  publicOrigin: environment.publicOrigin,
  onError: (error) => {
    vite.ssrFixStacktrace(error);
    logger.error({ err: error }, "Development request failed");
  },
  web: {
    asset: async () => null,
    creator: async (url) =>
      vite.transformIndexHtml(url, await readFile(resolve(root, "index.html"), "utf8")),
    reader: async (data, url) => {
      const module = await vite.ssrLoadModule("/src/reader/entry-server.tsx");
      const rendered = RenderedSchema.parse(module.renderReader(data));
      return vite.transformIndexHtml(
        url,
        readerDocument({
          ...rendered,
          data,
          script: "/src/reader/entry-client.tsx",
          styles: [],
          preloads: [],
        }),
      );
    },
  },
});
const listener = createNodeRequestListener(app, accountsRuntime);
server.on("request", (request, response) => {
  const pathname = new URL(request.url ?? "/", environment.publicOrigin).pathname;
  const vitePath =
    ["/src/", "/@vite/", "/@id/", "/@fs/", "/node_modules/.vite/"].some((prefix) =>
      pathname.startsWith(prefix),
    ) || pathname === "/@react-refresh";
  if (vitePath) vite.middlewares(request, response, () => void listener(request, response));
  else void listener(request, response);
});
server.listen(environment.port, environment.host, () =>
  logger.info({ port: environment.port }, "Development server ready"),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    void vite
      .close()
      .then(() => accountsRuntime?.close())
      .then(() => server.close(() => void database.end().then(() => process.exit(0))));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
