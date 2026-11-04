import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "../../packages/backend/src/identity/auth-schema.ts",
    "../../packages/backend/src/identity/schema.ts",
    "../../packages/backend/src/journeys/schema.ts",
    "../../packages/backend/src/journeys/admission-schema.ts",
    "../../packages/backend/src/sources/schema.ts",
    "../../packages/backend/src/operations/schema.ts",
  ],
  out: "../../packages/backend/migrations",
  strict: true,
});
