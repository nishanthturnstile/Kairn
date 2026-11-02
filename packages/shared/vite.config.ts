import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
    },
    format: "esm",
    platform: "neutral",
    target: "es2023",
    dts: true,
    sourcemap: true,
    clean: true,
  },
});
