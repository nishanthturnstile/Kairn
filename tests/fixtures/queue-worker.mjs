import { startWorker } from "@kairn/worker/runtime";

// Synthetic queue registration exists only in the test harness, never in an application entry.
const worker = await startWorker({
  connectionString: process.env.TEST_DATABASE_URL,
  onError: (error) => console.error(error.message),
  register: async (queue) => {
    await queue.work(
      process.env.TEST_QUEUE,
      { batchSize: 1, localConcurrency: 1, pollingIntervalSeconds: 1 },
      async ([job]) => job.data,
    );
  },
});
process.send("ready");
process.once("SIGTERM", () => {
  void worker.stop().then(() => process.exit(0));
});
