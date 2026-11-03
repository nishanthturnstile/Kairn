import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
const folder = new URL("../migrations/", import.meta.url);
const journal = JSON.parse(await readFile(new URL("meta/_journal.json", folder), "utf8"));
const migrations = [];
for (const entry of journal.entries) {
  const file = `${entry.tag}.sql`;
  migrations.push({
    file,
    sha256: createHash("sha256")
      .update(await readFile(new URL(file, folder)))
      .digest("hex"),
  });
}
await writeFile(
  new URL("manifest.json", folder),
  `${JSON.stringify({ version: 1, migrations }, null, 2)}\n`,
);
console.log("Recorded migration checksums; review before committing.");
