import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      client: "src/client.ts",
      schema: "src/schema.ts",
      types: "generated/api.ts",
    },
    format: "esm",
    platform: "neutral",
    target: "es2023",
    dts: true,
    sourcemap: true,
    clean: true,
  },
});
