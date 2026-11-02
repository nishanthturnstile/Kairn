import { rm, writeFile } from "node:fs/promises";
import { createLogger, readRuntimeConfig } from "@kairn/backend";
import { readDatabaseUrl } from "@kairn/backend/database";
import { startWorker } from "./runtime.js";

const logger = createLogger("worker", readRuntimeConfig(process.env));
const readyFile = "/tmp/kairn-worker-ready";
await rm(readyFile, { force: true });
const worker = await startWorker({
  connectionString: readDatabaseUrl(process.env.DATABASE_URL),
  onError: () => logger.error({ code: "queue_database_error" }, "Queue operation failed"),
});
// The production process registers only real product queues when their workstream begins.
// The foundation smoke handler is registered exclusively by the integration harness.
async function heartbeat() {
  try {
    await worker.queue.getDb().executeSql("SELECT 1");
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
      .then(() => worker.stop())
      .then(() => {
        clearTimeout(deadline);
        logger.info("Worker stopped");
      })
      .catch(() => process.exit(1));
  });
}
