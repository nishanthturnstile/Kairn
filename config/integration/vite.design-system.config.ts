import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["tests/integration/design-system.test.ts"],
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
