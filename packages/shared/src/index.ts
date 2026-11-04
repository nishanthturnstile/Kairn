/** Exhaustive handling for closed unions; callers cannot pass an unhandled member. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${String(value)}`);
}

/** A memory-only transfer keeps its command identities across ambiguous network failures.
 * A completion retry never rewrites bytes that may already have been processed.
 */
export function createAvatarTransfer(steps: {
  allocate: () => Promise<string>;
  write: () => Promise<void>;
  complete: () => Promise<string>;
  remove: (etag: string) => Promise<void>;
}) {
  let allocated = false;
  let written = false;
  let running = false;
  return {
    async resume() {
      if (running) throw new Error("This upload is already running.");
      running = true;
      try {
        if (!allocated) {
          await steps.allocate();
          allocated = true;
        }
        if (!written) {
          await steps.write();
          written = true;
        }
        await steps.complete();
      } finally {
        running = false;
      }
    },
    async discard() {
      if (running) throw new Error("Wait for this upload before removing it.");
      running = true;
      try {
        // Replaying the original command also obtains the current removal revision.
        const etag = written ? await steps.complete() : await steps.allocate();
        await steps.remove(etag);
      } finally {
        running = false;
      }
    },
  };
}
