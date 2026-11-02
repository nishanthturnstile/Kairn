import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: { index: "src/index.ts", runtime: "src/runtime.ts" },
    format: "esm",
    platform: "node",
    fixedExtension: false,
    target: "es2023",
    dts: true,
    sourcemap: true,
    clean: true,
    deps: { neverBundle: true },
  },
});
