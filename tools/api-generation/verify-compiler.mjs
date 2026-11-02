import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";
import ts from "typescript";

const require = createRequire(import.meta.url);
const generatorRequire = createRequire(require.resolve("openapi-typescript"));
const generatorTS = generatorRequire("typescript");
assert.equal(ts.version, "6.0.3");
assert.equal(generatorTS.version, ts.version);
assert.equal(generatorRequire.resolve("typescript"), require.resolve("typescript"));
assert.equal(typeof generatorTS.factory.createIdentifier, "function");

const directory = await mkdtemp(join(tmpdir(), "kairn-generator-"));
try {
  // Synthetic compiler fixture; actual wire schemas enter in setup step 2.
  const schema = {
    openapi: "3.1.0",
    info: { title: "Toolchain qualification", version: "1" },
    paths: {},
    components: {
      schemas: {
        Amount: {
          type: "object",
          required: ["amount", "state"],
          properties: {
            amount: { type: "string" },
            state: { type: "string", enum: ["ready", "unavailable"] },
          },
          additionalProperties: false,
        },
      },
    },
  };
  const input = join(directory, "schema.json");
  const output = join(directory, "generated.d.ts");
  await writeFile(input, JSON.stringify(schema));
  const apiOutput = astToString(await openapiTS(pathToFileURL(input)));
  const generatorCLI = join(
    require.resolve("openapi-typescript/package.json"),
    "..",
    "bin",
    "cli.js",
  );
  execFileSync(process.execPath, [generatorCLI, input, "--output", output], { stdio: "pipe" });
  const cliOutput = await readFile(output, "utf8");
  // CLI prepends its standard generated-file header; compare the declarations.
  assert.equal(
    cliOutput.slice(cliOutput.indexOf("export ")),
    apiOutput.slice(apiOutput.indexOf("export ")),
  );
  await writeFile(
    join(directory, "consumer.ts"),
    `import type { components } from './generated.js';
const valid: components['schemas']['Amount'] = { amount: '12.50', state: 'ready' };
// @ts-expect-error Money must remain a string at this synthetic wire boundary.
const invalidAmount: components['schemas']['Amount'] = { amount: 12.5, state: 'ready' };
// @ts-expect-error Unknown states must remain invalid.
const invalidState: components['schemas']['Amount'] = { amount: '12.50', state: 'processing' };
export { valid, invalidAmount, invalidState };
`,
  );
  const compilerArgs = [
    "--ignoreConfig",
    "--strict",
    "--skipLibCheck",
    "false",
    "--noEmit",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "--target",
    "ES2023",
    join(directory, "consumer.ts"),
  ];
  const compiler6 = join(
    require.resolve("typescript/package.json"),
    "..",
    require("typescript/package.json").bin.tsc,
  );
  const rootRequire = createRequire(new URL("../../package.json", import.meta.url));
  const compiler7 = join(
    rootRequire.resolve("typescript/package.json"),
    "..",
    rootRequire("typescript/package.json").bin.tsc,
  );
  for (const compiler of [compiler6, compiler7]) {
    execFileSync(process.execPath, [compiler, ...compilerArgs], { stdio: "inherit" });
  }
  console.log(
    "PASS generator CLI/API use TypeScript 6.0.3; identical declarations pass TS6 and TS7 positive/negative consumers.",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
