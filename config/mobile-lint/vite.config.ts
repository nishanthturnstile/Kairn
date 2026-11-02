import { defineConfig } from "vite-plus";
import { lintRules } from "../lint-rules.js";

export default defineConfig({
  lint: {
    options: { typeAware: false, typeCheck: false },
    ignorePatterns: ["**/node_modules/**", "**/android/**", "**/ios/**", "**/.expo/**"],
    rules: lintRules,
  },
});
