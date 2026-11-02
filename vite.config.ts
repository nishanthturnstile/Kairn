import { defineConfig } from "vite-plus";
import { lintRules } from "./config/lint-rules.js";

export default defineConfig({
  lint: {
    ignorePatterns: [
      ".agents/**",
      "docs/research/**",
      "**/dist/**",
      "**/dist-dev/**",
      "**/routeTree.gen.ts",
      "**/generated/**",
      "**/openapi/**",
      "tests/types/**",
      "apps/mobile/**",
    ],
    options: { typeAware: true, typeCheck: true },
    rules: lintRules,
  },
  fmt: {
    ignorePatterns: [
      ".agents/**",
      "docs/**",
      "AGENTS.md",
      "pnpm-lock.yaml",
      "**/routeTree.gen.ts",
      "**/generated/**",
      "**/openapi/**",
    ],
  },
  test: { include: ["tests/shared/**/*.test.ts"], environment: "node" },
});
