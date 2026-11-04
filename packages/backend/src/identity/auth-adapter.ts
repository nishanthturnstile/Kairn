import * as schema from "./auth-schema.js";

/** Server-only Better Auth adapter input. Never a wire/profile schema or client export. */
export function authAdapterSchema() {
  return schema;
}
