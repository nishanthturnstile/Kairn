import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createWriteStream, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
assert.equal(process.platform, "linux", "Run Compose verification in WSL or Linux CI.");
const metadata = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
assert.equal(process.versions.node, metadata.engines.node, "Select the pinned Node runtime.");
const evidenceRoot = join(root, ".kairn/verification");
mkdirSync(evidenceRoot, { recursive: true });
const directory = mkdtempSync(join(evidenceRoot, "run-"));
const project = `kairn-quality-${process.pid}-${randomUUID().slice(0, 8)}`;
const container = `${project}-tooling`;
const compose = ["compose", "--project-name", project];
const result = {
  startedAt: new Date().toISOString(),
  finishedAt: "",
  status: "running",
  node: process.versions.node,
  commit: spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim(),
  worktree: spawnSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" }).stdout.trim(),
  artifacts: /** @type {string[]} */ ([]),
  sourceComparisons: /** @type {{path: string, sha256: string}[]} */ ([]),
};
let sequence = 0;

/** @param {string} command @param {string[]} args @param {boolean} [required] */
async function run(command, args, required = true) {
  const log = createWriteStream(join(directory, `${String(++sequence).padStart(2, "0")}.log`));
  const label = `${command} ${args.join(" ")}`;
  console.log(`\n${label}`);
  log.write(`${label}\n`);
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    log.write(chunk);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
    log.write(chunk);
  });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  }).finally(() => log.end());
  if (required) assert.equal(code, 0, `${label} failed; evidence: ${directory}`);
  return code;
}

/** @param {string} path @param {string} name */
async function copyArtifact(path, name) {
  const target = join(directory, name);
  mkdirSync(join(target, ".."), { recursive: true });
  if ((await run("docker", ["cp", `${container}:/app/${path}`, target], false)) === 0) {
    result.artifacts.push(name);
    return target;
  }
}

try {
  for (const files of [
    ["compose.yaml", "compose.override.yaml"],
    ["compose.yaml", "infra/compose/production.yaml"],
    ["compose.yaml", "infra/compose/production.yaml", "infra/compose/data-test.yaml"],
  ])
    await run("docker", [
      ...compose,
      ...files.flatMap((file) => ["-f", file]),
      "config",
      "--quiet",
    ]);
  await run("docker", [...compose, "--profile", "tools", "build", "tooling"]);
  let toolingPassed = false;
  try {
    await run("docker", [
      ...compose,
      "--profile",
      "tools",
      "run",
      "--name",
      container,
      "--no-deps",
      "tooling",
      "sh",
      "-c",
      "pnpm verify:toolchain && pnpm check && pnpm test && pnpm build && pnpm verify:shared",
    ]);
    toolingPassed = true;
  } finally {
    for (const [path, name] of [
      ["apps/mobile/export-android", "export-android"],
      ["apps/mobile/export-ios", "export-ios"],
      ["apps/web/dist/client/.vite/manifest.json", "web-manifest.json"],
    ]) {
      assert.ok(path && name);
      await copyArtifact(path, name);
    }
    for (const [path, name] of [
      ["package.json", "inputs/package.json"],
      ["pnpm-lock.yaml", "inputs/pnpm-lock.yaml"],
      ["apps/mobile/package.json", "inputs/mobile-package.json"],
      ["apps/web/src/routeTree.gen.ts", "inputs/routeTree.gen.ts"],
      ["packages/contracts/openapi/api.json", "inputs/api.json"],
      ["packages/contracts/generated/api.ts", "inputs/api.ts"],
    ]) {
      assert.ok(path && name);
      const target = await copyArtifact(path, name);
      if (!target) continue;
      const content = readFileSync(target);
      assert.deepEqual(content, readFileSync(join(root, path)), `Generated input drift: ${path}`);
      result.sourceComparisons.push({
        path,
        sha256: createHash("sha256").update(content).digest("hex"),
      });
    }
  }
  if (toolingPassed) {
    assert.equal(
      result.artifacts.length,
      9,
      "The tooling container did not retain every required artifact.",
    );
    assert.equal(
      result.sourceComparisons.length,
      6,
      "Not all generated inputs were checked for drift.",
    );
  }
  // Existing wrappers own isolated application projects, durability checks, and cleanup.
  await run(process.execPath, [join(root, "scripts/verify-web.mjs")]);
  await run(process.execPath, [join(root, "scripts/verify-identity.mjs")]);
  await run(process.execPath, [join(root, "scripts/verify-domain.mjs")]);
  await run(process.execPath, [join(root, "scripts/verify-data.mjs")]);
  result.status = "passed";
  console.log(
    "PASS container checks, all JavaScript exports, final images, HTTP, queue, and storage integration.",
  );
  console.log("Native compilation and Android/iOS device acceptance are separate gates.");
} catch (error) {
  result.status = "failed";
  throw error;
} finally {
  try {
    const cleanup = await run(
      "docker",
      [...compose, "--profile", "tools", "down", "--remove-orphans"],
      false,
    );
    assert.equal(cleanup, 0, "Quality project cleanup failed.");
  } catch (error) {
    result.status = "failed";
    process.exitCode = 1;
    console.error(error);
  }
  result.finishedAt = new Date().toISOString();
  writeFileSync(join(directory, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(
    join(evidenceRoot, "latest.json"),
    `${JSON.stringify({ directory, ...result }, null, 2)}\n`,
  );
  console.log(`Verification evidence: ${directory}`);
}
