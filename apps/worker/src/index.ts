import { rm, writeFile } from "node:fs/promises";
import { createLogger, readRuntimeConfig } from "@kairn/backend";
import { checkDatabase, createDatabasePool, readDatabaseUrl } from "@kairn/backend/database";
import { startWorker } from "./runtime.js";
import { registerDomainWorkers } from "@kairn/backend/workers";
import { loadDomainWorkerConfig } from "@kairn/backend/worker-config";

const logger = createLogger("worker", readRuntimeConfig(process.env));
const readyFile = "/tmp/kairn-worker-ready";
await rm(readyFile, { force: true });
const connectionString = readDatabaseUrl(process.env.DATABASE_URL);
// A bounded control pool checks the same supported schema as the API. The queue owns its pool.
const database = createDatabasePool(connectionString, "kairn-worker-readiness", 1);
database.on("error", () =>
  logger.error({ code: "database_error" }, "Idle readiness connection failed"),
);
await checkDatabase(database);
const domainConfig = process.env.KAIRN_DOMAIN_WORKER_CONFIG
  ? await loadDomainWorkerConfig(process.env.KAIRN_DOMAIN_WORKER_CONFIG)
  : undefined;
const domainPool = domainConfig
  ? createDatabasePool(connectionString, "kairn-worker-domain", 2)
  : undefined;
domainPool?.on("error", () =>
  logger.error({ code: "domain_database_error" }, "Domain database unavailable"),
);
let domainWorkers: Awaited<ReturnType<typeof registerDomainWorkers>> | undefined;
const worker = await startWorker({
  connectionString,
  onError: () => logger.error({ code: "queue_database_error" }, "Queue operation failed"),
  register: async (queue) => {
    if (domainConfig && domainPool)
      domainWorkers = await registerDomainWorkers(queue, domainPool, {
        ...domainConfig,
        onError: () => logger.warn({ code: "domain_work_pending" }, "Domain work remains pending"),
      });
  },
});
// The production process registers only real product queues when their workstream begins.
// The foundation smoke handler is registered exclusively by the integration harness.
async function heartbeat() {
  try {
    await checkDatabase(database);
    await writeFile(readyFile, String(Date.now()));
  } catch {
    await rm(readyFile, { force: true });
    logger.warn({ code: "database_unavailable" }, "Worker is not ready");
  }
}
await heartbeat();
const timer = setInterval(() => void heartbeat(), 5_000);
logger.info("Worker started");
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    clearInterval(timer);
    const deadline = setTimeout(() => process.exit(1), 10_000);
    void rm(readyFile, { force: true })
      .then(() => domainWorkers?.stop())
      .then(() => worker.stop())
      .then(() => domainPool?.end())
      .then(() => domainConfig?.close())
      .then(() => database.end())
      .then(() => {
        clearTimeout(deadline);
        logger.info("Worker stopped");
      })
      .catch(() => process.exit(1));
  });
}
