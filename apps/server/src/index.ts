import { serve } from "@hono/node-server";
import { createLogger } from "@kairn/backend";
import { checkDatabase, createDatabasePool, readDatabaseUrl } from "@kairn/backend/database";
import { createApp } from "./app.js";
import { readServerEnvironment } from "./environment.js";
import { createProductionWeb } from "./production-web.js";

const environment = readServerEnvironment(process.env);
const logger = createLogger("server", environment);
const database = createDatabasePool(readDatabaseUrl(process.env.DATABASE_URL), "kairn-server");
database.on("error", () =>
  logger.error({ code: "database_error" }, "Idle database connection failed"),
);
await checkDatabase(database);
const app = createApp({
  web: await createProductionWeb(),
  publicOrigin: environment.publicOrigin,
  onError: (error) => logger.error({ err: error }, "Request failed"),
  checkReady: () => checkDatabase(database),
});
const server = serve({ fetch: app.fetch, hostname: environment.host, port: environment.port }, () =>
  logger.info({ port: environment.port }, "Server ready"),
);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(() => void database.end().then(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
