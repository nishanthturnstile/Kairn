import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const webDirectory = fileURLToPath(new URL("../apps/web/", import.meta.url));
const require = createRequire(join(webDirectory, "package.json"));
const { build } = await import(pathToFileURL(require.resolve("vite")).href);
const directory = await mkdtemp(join(webDirectory, ".toolchain-probe-"));
const marker = "KAIRN_SEEDED_SERVER_SECRET_DO_NOT_SHIP";
const fixture = join(directory, "client.ts");
try {
  const config = {
    configFile: join(webDirectory, "vite.config.ts"),
    root: webDirectory,
    logLevel: "error",
    define: { "process.env.KAIRN_SERVER_SECRET": JSON.stringify(marker) },
    build: { write: false, minify: true, sourcemap: false, rolldownOptions: { input: fixture } },
  };
  await writeFile(
    fixture,
    `
import * as contracts from '@kairn/contracts';
import * as shared from '@kairn/shared';
import * as protocol from '@kairn/sync-protocol';
import { tokens } from '@kairn/design-tokens';
import { createApiClient } from '@kairn/contracts/client';
globalThis.kairnFixture = { contracts, shared, protocol, tokens, client: createApiClient({ baseUrl: 'https://fixture.invalid', fetch: globalThis.fetch }) };
`,
  );
  const result = await build(config);
  const bundles = Array.isArray(result) ? result : [result];
  for (const bundle of bundles) {
    for (const output of bundle.output) {
      if (output.type !== "chunk") continue;
      assert.ok(!output.code.includes(marker), "Seeded server secret reached a client artifact");
      assert.doesNotMatch(output.code, /__vite-browser-external/);
      for (const module of Object.keys(output.modules))
        assert.doesNotMatch(
          module,
          /(?:packages\/backend|node_modules\/(?:hono|pino|openapi-typescript|@hono)\/)/,
        );
    }
  }
  // Exercise the rejection against an actual bad build, not a config-string assertion.
  await writeFile(
    fixture,
    'import { readFileSync } from "node:fs"; console.log(readFileSync("fixture"));',
  );
  await assert.rejects(() => build(config), /Forbidden client import: node:fs/);
  await writeFile(fixture, "console.log(process.env.KAIRN_SERVER_SECRET);");
  await assert.rejects(() => build(config), /Server bytes reached a client artifact/);
  console.log(
    "PASS production browser bundle contains universal exports/client without server modules or seeded secrets; negative Node/secret probes exercised.",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
