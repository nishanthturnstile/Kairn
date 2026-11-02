import { createJobQueue } from "@kairn/backend/queue";

export async function startWorker(options: {
  connectionString: string;
  onError: (error: Error) => void;
  register?: (queue: ReturnType<typeof createJobQueue>) => Promise<void>;
}): Promise<{
  queue: ReturnType<typeof createJobQueue>;
  stop: () => Promise<void>;
}> {
  const queue = createJobQueue(options.connectionString);
  queue.on("error", options.onError);
  try {
    await queue.start({ attempts: 4 });
    await options.register?.(queue);
    return {
      queue,
      stop: () => queue.stop({ graceful: true, timeout: 8_000 }),
    };
  } catch (error) {
    await queue.stop({ graceful: false });
    throw error;
  }
}
