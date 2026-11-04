import { createApiClient, type paths } from "@kairn/contracts/client";
import { SystemStatusSchema } from "@kairn/contracts";

const client = createApiClient({
  baseUrl: "https://api.example.test",
  fetch: (request) => fetch(request),
});
const response = await client.GET("/api/v1/system");
if (response.data) SystemStatusSchema.parse(response.data);
// @ts-expect-error Listing uses the account-scoped /me/journeys path.
client.GET("/api/v1/journeys");
// @ts-expect-error The read-only setup contract exposes no POST operation.
client.POST("/api/v1/system");
// @ts-expect-error A transport is required, rather than implicitly using a host default.
createApiClient({ baseUrl: "https://api.example.test" });
type Status = paths["/api/v1/system"]["get"]["responses"][200]["content"]["application/json"];
const valid: Status = { contractVersion: 1, syncProtocolVersion: 1, status: "ok" };
// @ts-expect-error Invalid status values must remain invalid in generated declarations.
const invalid: Status = { ...valid, status: "ready" };
export { valid, invalid };

type CapabilityCommand =
  paths["/api/v1/journeys/{id}/members/{memberId}/capabilities"]["put"]["requestBody"]["content"]["application/json"];
const powers: CapabilityCommand["powers"] = { coauthor: true, publisher: false };
// @ts-expect-error Administration cannot be submitted through a power edit.
const injectedAdmin: CapabilityCommand["powers"] = { ...powers, administrator: true };
// @ts-expect-error Mutations require an explicit If-Match header.
client.PATCH("/api/v1/me/profile", {
  body: { commandId: "b039656c-f32c-4eec-8756-328de4feb8c0", displayName: "Sample", bio: null },
});
export { powers, injectedAdmin };

type SourceGrantMutation =
  paths["/api/v1/sources/{id}/journeys/{journeyId}/grant"]["put"]["responses"][200]["content"]["application/json"];
export const confirmedSourceRestriction: SourceGrantMutation = {
  operationId: "b039656c-f32c-4eec-8756-328de4feb8c0",
  statusLocation: "/api/v1/operations/b039656c-f32c-4eec-8756-328de4feb8c0",
  status: "restriction_complete",
  access: "denied",
  recoveryConfirmation: "confirmed",
};

type InternalFailure =
  paths["/api/v1/me"]["get"]["responses"][500]["content"]["application/problem+json"];
export const internalFailure: InternalFailure = {
  type: "https://api.example.test/problems/internal-error",
  title: "The request could not be completed.",
  status: 500,
  code: "internal_error",
  requestId: "b039656c-f32c-4eec-8756-328de4feb8c0",
};
