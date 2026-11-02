import { ApiErrorSchema } from "@kairn/contracts";
import { z } from "zod";

export const SYNC_PROTOCOL_VERSION = 1;
const identity = {
  protocolVersion: z.literal(SYNC_PROTOCOL_VERSION),
  commandId: z.uuid(),
};

/** A stable command ID must be persisted by the caller before sending or retrying. */
export function createCommandEnvelopeSchema<TName extends string, TPayload extends z.ZodType>(
  command: TName,
  payload: TPayload,
) {
  return z.strictObject({ ...identity, command: z.literal(command), payload });
}

/** This wire envelope alone makes no durability or idempotent-execution guarantee. */
export function createResultEnvelopeSchema<TResult extends z.ZodType>(result: TResult) {
  return z.discriminatedUnion("status", [
    z.strictObject({ ...identity, status: z.literal("accepted"), result }),
    z.strictObject({ ...identity, status: z.literal("rejected"), error: ApiErrorSchema }),
  ]);
}
