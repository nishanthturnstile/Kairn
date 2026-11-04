import { defineConfig } from "vite-plus";
export default defineConfig({
  test: {
    include: ["tests/integration/accounts-web.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});
