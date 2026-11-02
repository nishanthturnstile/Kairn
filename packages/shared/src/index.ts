/** Exhaustive handling for closed unions; callers cannot pass an unhandled member. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${String(value)}`);
}
