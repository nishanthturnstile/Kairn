import { createApiClient, type paths } from "@kairn/contracts/client";
import { SystemStatusSchema } from "@kairn/contracts";

const client = createApiClient({
  baseUrl: "https://api.example.test",
  fetch: (request) => fetch(request),
});
const response = await client.GET("/api/v1/system");
if (response.data) SystemStatusSchema.parse(response.data);
// @ts-expect-error The generated client must reject routes absent from OpenAPI.
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
