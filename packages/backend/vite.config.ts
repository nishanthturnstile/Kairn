import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      database: "src/database.ts",
      queue: "src/queue.ts",
      "job-producer": "src/job-producer.ts",
      bootstrap: "src/bootstrap.ts",
      migrations: "src/migrations.ts",
      identity: "src/identity/context.ts",
      "auth-options": "src/identity/auth-options.ts",
      "auth-adapter": "src/identity/auth-adapter.ts",
      workers: "src/operations/workers.ts",
      "worker-config": "src/operations/worker-config.ts",
      "journal-server": "src/operations/journal-server.ts",
      commands: "src/operations/commands.ts",
      journal: "src/operations/journal.ts",
      mail: "src/operations/mail.ts",
      media: "src/identity/media.ts",
      recovery: "src/operations/recovery.ts",
      "avatar-codec": "src/identity/avatar-codec.ts",
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
