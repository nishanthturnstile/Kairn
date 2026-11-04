import { copyFile, cp, mkdir } from "node:fs/promises";
import { basename } from "node:path";
const source = new URL("../migrations/", import.meta.url);
const target = new URL("../dist/migrations/", import.meta.url);
await mkdir(target, { recursive: true });
// Snapshots/journal are authoring inputs; runtime uses reviewed SQL plus checksums.
await cp(source, target, { recursive: true, filter: (path) => basename(path) !== "meta" });

await copyFile(
  new URL("../src/identity/password-blocklist-LICENSE.txt", import.meta.url),
  new URL("../dist/password-blocklist-LICENSE.txt", import.meta.url),
);
