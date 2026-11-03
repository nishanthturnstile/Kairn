import { defineConfig } from "vite-plus";
export default defineConfig({
  test: {
    include: ["tests/integration/domain.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
