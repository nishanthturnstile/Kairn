import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      database: "src/database.ts",
      queue: "src/queue.ts",
      bootstrap: "src/bootstrap.ts",
    },
    format: "esm",
    platform: "node",
    fixedExtension: false,
    target: "es2023",
    dts: true,
    sourcemap: true,
    clean: true,
  },
});
