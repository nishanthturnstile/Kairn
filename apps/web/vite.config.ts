import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { clientBoundary, secretMarker } from "../../config/client-boundary.js";

export default defineConfig(({ isSsrBuild }) => ({
  define: { "process.env.KAIRN_SERVER_SECRET": JSON.stringify(secretMarker) },
  plugins: [
    clientBoundary(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  appType: "custom",
  server: {
    allowedHosts: [
      new URL(process.env.PUBLIC_ORIGIN ?? "http://localhost:8080").hostname,
      "edge",
      "server",
    ],
  },
  build: isSsrBuild
    ? {
        outDir: "dist/server",
        emptyOutDir: true,
        sourcemap: true,
        rolldownOptions: { output: { entryFileNames: "reader.js" } },
      }
    : {
        outDir: "dist/client",
        emptyOutDir: true,
        manifest: true,
        rolldownOptions: {
          input: {
            creator: fileURLToPath(new URL("./index.html", import.meta.url)),
            reader: fileURLToPath(new URL("./src/reader/entry-client.tsx", import.meta.url)),
          },
        },
      },
}));
