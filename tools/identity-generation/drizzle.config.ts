import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "../../packages/backend/src/identity/auth-schema.ts",
    "../../packages/backend/src/identity/schema.ts",
  ],
  out: "../../packages/backend/migrations",
  strict: true,
});
