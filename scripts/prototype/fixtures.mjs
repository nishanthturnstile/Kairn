import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const source = new URL("tests/fixtures/prototype/", root);
const files = (await readdir(source))
  .filter((name) => /\.(json|ttf|woff2|txt|png)$/.test(name))
  .sort();
const hash = createHash("sha256");
for (const name of files) hash.update(name).update(await readFile(new URL(name, source)));
const revision = hash.digest("hex");
for (const app of ["web", "mobile"]) {
  const target = new URL(`apps/${app}/src/prototype/generated/`, root);
  await mkdir(target, { recursive: true });
  for (const name of [...files, "revision.json"]) {
    const bytes =
      name === "revision.json"
        ? Buffer.from(`${JSON.stringify({ sha256: revision }, null, 2)}\n`)
        : await readFile(new URL(name, source));
    if (process.argv.includes("--check")) {
      const actual = await readFile(new URL(name, target));
      if (!actual.equals(bytes))
        throw new Error(`${app}/${name}: stale fixture; run prototype:seed`);
    } else await writeFile(new URL(name, target), bytes);
  }
}
console.log(
  `Prototype fixtures ${process.argv.includes("--check") ? "verified" : "copied"}: ${revision}`,
);
