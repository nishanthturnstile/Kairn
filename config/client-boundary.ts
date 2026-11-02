import { isBuiltin } from "node:module";
import type { Plugin } from "vite-plus";

export const secretMarker = "KAIRN_SEEDED_SERVER_SECRET_DO_NOT_SHIP";
export function clientBoundary(): Plugin {
  return {
    name: "kairn-client-boundary",
    enforce: "pre",
    apply: (_config, environment) => environment.command === "build" && !environment.isSsrBuild,
    resolveId(source) {
      if (isBuiltin(source) || source === "@kairn/backend" || source === "@kairn/contracts/schema")
        throw new Error(`Forbidden client import: ${source}`);
    },
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk") continue;
        if (output.code.includes(secretMarker) || output.code.includes("__vite-browser-external"))
          throw new Error("Server bytes reached a client artifact.");
        for (const id of Object.keys(output.modules)) {
          if (
            /(?:packages\/backend\/|apps\/server\/|node_modules\/(?:hono|pino|openapi-typescript|@hono)\/)/.test(
              id.replaceAll("\\", "/"),
            )
          )
            throw new Error(`Server module reached a client artifact: ${id}`);
        }
      }
    },
  };
}
