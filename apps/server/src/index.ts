import { serve } from "@hono/node-server";
import { createLogger } from "@kairn/backend";
import { checkDatabase, createDatabasePool, readDatabaseUrl } from "@kairn/backend/database";
import { createApp } from "./app.js";
import { loadAccountRuntime } from "./accounts/runtime.js";
import { createNodeFetch } from "./node-handler.js";
import { readServerEnvironment } from "./environment.js";
import { createProductionWeb } from "./production-web.js";

const environment = readServerEnvironment(process.env);
const logger = createLogger("server", environment);
const database = createDatabasePool(readDatabaseUrl(process.env.DATABASE_URL), "kairn-server");
database.on("error", () =>
  logger.error({ code: "database_error" }, "Idle database connection failed"),
);
await checkDatabase(database);
const accountsRuntime = await loadAccountRuntime(
  process.env.KAIRN_ACCOUNTS_CONFIG,
  environment.publicOrigin,
  database,
);
const app = createApp({
  ...(accountsRuntime ? { accounts: accountsRuntime.accounts } : {}),
  web: await createProductionWeb(),
  publicOrigin: environment.publicOrigin,
  onError: (error) => logger.error({ err: error }, "Request failed"),
  checkReady: async () => {
    await checkDatabase(database);
    await accountsRuntime?.checkReady();
  },
});
const server = serve(
  {
    fetch: createNodeFetch(app, accountsRuntime),
    hostname: environment.host,
    port: environment.port,
  },
  () => logger.info({ port: environment.port }, "Server ready"),
);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(
      () =>
        void Promise.resolve(accountsRuntime?.close())
          .then(() => database.end())
          .then(() => process.exit(0)),
    );
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
