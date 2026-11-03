import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      database: "src/database.ts",
      queue: "src/queue.ts",
      bootstrap: "src/bootstrap.ts",
      migrations: "src/migrations.ts",
      identity: "src/identity/context.ts",
      "auth-options": "src/identity/auth-options.ts",
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
