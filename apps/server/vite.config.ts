import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: { index: "src/index.ts", app: "src/app.ts", "accounts-auth": "src/accounts/auth.ts" },
    platform: "node",
    format: "esm",
    fixedExtension: false,
    dts: true,
    sourcemap: true,
    clean: true,
    deps: { neverBundle: true },
  },
});
