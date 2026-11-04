import { defineConfig } from "vite-plus";
export default defineConfig({
  test: {
    include: ["tests/integration/identity.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
