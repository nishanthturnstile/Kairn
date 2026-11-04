import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(new URL("../package.json", import.meta.url));
const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));
const mobileRequire = createRequire(new URL("../apps/mobile/package.json", import.meta.url));
const rootPackage = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
assert.equal(process.versions.node, rootPackage.engines.node, "Use the pinned Node runtime.");
const manager = execFileSync("pnpm", ["--version"], {
  encoding: "utf8",
  shell: process.platform === "win32",
}).trim();
assert.equal(manager, rootPackage.engines.pnpm);

const expected = [
  "apps/mobile",
  "apps/server",
  "apps/web",
  "apps/worker",
  "packages/backend",
  "packages/contracts",
  "packages/design-tokens",
  "packages/shared",
  "packages/sync-protocol",
  "tools/api-generation",
  "tools/identity-generation",
];
const actual = [];
for (const group of ["apps", "packages", "tools"]) {
  for (const entry of await readdir(join(root, group), { withFileTypes: true })) {
    if (entry.isDirectory()) actual.push(`${group}/${entry.name}`);
  }
}
assert.deepEqual(actual.sort(), expected);
for (const workspace of expected) {
  const manifest = JSON.parse(await readFile(join(root, workspace, "package.json"), "utf8"));
  assert.equal(manifest.private, true, workspace);
  for (const [name, specifier] of Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  })) {
    if (name.startsWith("@kairn/")) assert.equal(specifier, "workspace:*", `${workspace}: ${name}`);
  }
}
assert.equal(require("typescript").version, "7.0.2");
assert.equal(mobileRequire("typescript").version, "6.0.3");
assert.equal(webRequire("react").version, "19.3.1");
assert.equal(webRequire("react-dom").version, "19.3.1");
assert.equal(mobileRequire("react").version, "19.3.0");
const pluginRequire = createRequire(webRequire.resolve("@vitejs/plugin-react"));
assert.equal(
  pluginRequire.resolve("vite"),
  webRequire.resolve("vite"),
  "Plugin and web must share Vite core.",
);
const vite = await import(pathToFileURL(webRequire.resolve("vite")).href);
const { default: react } = await import(
  pathToFileURL(webRequire.resolve("@vitejs/plugin-react")).href
);
assert.equal(vite.version, "8.3.5");
for (const absent of ["@expo/ui", "nativewind", "react-native-edge-to-edge"]) {
  assert.throws(() => mobileRequire.resolve(`${absent}/package.json`), {
    code: "MODULE_NOT_FOUND",
  });
}
console.log(
  "PASS exact workspace set, compiler/React split, shared Vite identity, optional native peers absent.",
);

const directory = await mkdtemp(join(root, ".toolchain-probe-"));
try {
  const fixture = join(directory, "reader.jsx");
  const reactPath = JSON.stringify(webRequire.resolve("react"));
  await writeFile(
    fixture,
    `import React from ${reactPath}; export function Reader({ label }) { return <p>{label}</p>; }`,
  );
  // A real JSX transform and SSR render exercise the aliased core/plugin graph.
  const sharedConfig = {
    configFile: false,
    root: directory,
    logLevel: "error",
    plugins: [react({ jsxRuntime: "classic" })],
  };
  await vite.build({
    ...sharedConfig,
    build: {
      outDir: join(directory, "client"),
      lib: { entry: fixture, formats: ["es"], fileName: "reader" },
      rollupOptions: { external: ["react"] },
    },
  });
  await vite.build({ ...sharedConfig, build: { outDir: join(directory, "server"), ssr: fixture } });
  const { Reader } = await import(pathToFileURL(join(directory, "server", "reader.js")).href);
  const { renderToString } = await import(
    pathToFileURL(webRequire.resolve("react-dom/server")).href
  );
  const React = webRequire("react");
  assert.equal(
    renderToString(React.createElement(Reader, { label: "Pinned toolchain" })),
    "<p>Pinned toolchain</p>",
  );
  console.log("PASS Vite+/React plugin browser build, SSR build, and actual React render.");
  const badType = join(directory, "invalid.ts");
  const compilerConfig = join(directory, "tsconfig.json");
  await writeFile(
    compilerConfig,
    JSON.stringify({
      compilerOptions: { strict: true, noEmit: true, types: [], lib: ["ES2023"] },
      files: ["invalid.ts"],
    }),
  );
  await writeFile(badType, "const value: string = 'valid'; export { value };");
  for (const owner of [require, mobileRequire]) {
    execFileSync(
      process.execPath,
      [
        join(
          owner.resolve("typescript/package.json"),
          "..",
          owner("typescript/package.json").bin.tsc,
        ),
        "--project",
        compilerConfig,
      ],
      { stdio: "pipe", cwd: root },
    );
  }
  await writeFile(badType, "const value: string = 42; export { value };");
  for (const owner of [require, mobileRequire]) {
    const result = spawnSync(
      process.execPath,
      [
        join(
          owner.resolve("typescript/package.json"),
          "..",
          owner("typescript/package.json").bin.tsc,
        ),
        "--project",
        compilerConfig,
      ],
      { encoding: "utf8", cwd: root },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /TS2322/);
  }
  console.log("PASS both compiler entry points reject an intentional type error.");
} finally {
  await rm(directory, { recursive: true, force: true });
}
execFileSync(process.execPath, [join(root, "tools/api-generation/verify-compiler.mjs")], {
  stdio: "inherit",
  cwd: root,
});
