import { CONTRACT_VERSION, SystemStatusSchema, type SystemStatus } from "@kairn/contracts";
import { assertNever } from "@kairn/shared";
import { tokens } from "@kairn/design-tokens";
import { SYNC_PROTOCOL_VERSION, createCommandEnvelopeSchema } from "@kairn/sync-protocol";

const status: SystemStatus = {
  contractVersion: CONTRACT_VERSION,
  syncProtocolVersion: SYNC_PROTOCOL_VERSION,
  status: "ok",
};
const command = createCommandEnvelopeSchema("fixture.status", SystemStatusSchema).parse({
  protocolVersion: SYNC_PROTOCOL_VERSION,
  commandId: "b039656c-f32c-4eec-8756-328de4feb8c0",
  command: "fixture.status",
  payload: status,
});
const literalCommand: "fixture.status" = command.command;
const radius: 14 = tokens.radius.medium;
// @ts-expect-error Contract version is a literal, not an arbitrary number.
const invalidVersion: SystemStatus = { ...status, contractVersion: 2 };
// @ts-expect-error Unknown status values cannot cross this contract.
const invalidStatus: SystemStatus = { ...status, status: "ready" };
// @ts-expect-error Exhaustive checking must reject a remaining union member.
assertNever("unhandled");
// @ts-expect-error Pure exports must not introduce Node globals.
process;
export { status, literalCommand, radius, invalidVersion, invalidStatus };
