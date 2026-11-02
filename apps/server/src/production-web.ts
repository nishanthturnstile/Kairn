import { readFile, realpath } from "node:fs/promises";
import { resolve, relative, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { renderReader } from "@kairn/web/reader";
import { readerDocument } from "./document.js";
import type { WebAdapter } from "./app.js";

const ManifestEntrySchema = z.object({
  file: z.string(),
  css: z.array(z.string()).default([]),
  assets: z.array(z.string()).default([]),
  imports: z.array(z.string()).default([]),
});
const ManifestSchema = z.record(z.string(), ManifestEntrySchema);
const contentTypes: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

export async function createProductionWeb(): Promise<WebAdapter> {
  const root = await realpath(
    fileURLToPath(new URL("../client/", import.meta.resolve("@kairn/web/reader"))),
  );
  const manifest = ManifestSchema.parse(
    JSON.parse(await readFile(resolve(root, ".vite/manifest.json"), "utf8")),
  );
  const creatorHTML = await readFile(resolve(root, "index.html"), "utf8");
  const allowed = new Set(
    Object.values(manifest)
      .flatMap((entry) => [entry.file, ...entry.css, ...entry.assets])
      .filter((file) => /^assets\/[a-zA-Z0-9_./-]+$/.test(file) && !file.endsWith(".map")),
  );
  const entry = manifest["src/reader/entry-client.tsx"];
  if (!entry || !allowed.has(entry.file)) throw new Error("Missing reader client manifest entry.");
  // Qualify all static and lazy assets before the process can report readiness.
  for (const path of allowed) {
    const file = await realpath(resolve(root, path));
    if (relative(root, file).startsWith(`..${sep}`))
      throw new Error("Manifest asset escapes the client directory.");
  }
  const styles = new Set<string>();
  const preloads = new Set<string>();
  const visited = new Set<string>();
  function collect(key: string) {
    if (visited.has(key)) return;
    visited.add(key);
    const item = manifest[key];
    if (!item) throw new Error(`Missing imported manifest entry ${key}`);
    for (const css of item.css) {
      if (!allowed.has(css)) throw new Error("Invalid stylesheet asset.");
      styles.add(`/${css}`);
    }
    for (const imported of item.imports) {
      const dependency = manifest[imported];
      if (!dependency || !allowed.has(dependency.file)) throw new Error("Invalid preload asset.");
      preloads.add(`/${dependency.file}`);
      collect(imported);
    }
  }
  collect("src/reader/entry-client.tsx");
  return {
    creator: async () => creatorHTML,
    reader: async (data) =>
      readerDocument({
        ...renderReader(data),
        data,
        script: `/${entry.file}`,
        styles: [...styles],
        preloads: [...preloads],
      }),
    asset: async (pathname) => {
      let path: string;
      try {
        path = decodeURIComponent(pathname).slice(1);
      } catch {
        return null;
      }
      if (!allowed.has(path)) return null;
      const type = contentTypes[extname(path)];
      if (!type) return null;
      const file = await realpath(resolve(root, path)).catch(() => null);
      if (!file || relative(root, file).startsWith(`..${sep}`)) return null;
      return new Response(await readFile(file), {
        headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
      });
    },
  };
}
