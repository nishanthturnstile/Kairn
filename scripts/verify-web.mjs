import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:net";

// Host wrapper only. Test containers never invoke Docker or receive its socket.
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", () => resolve(undefined)));
const address = reservation.address();
assert.ok(address && typeof address !== "string");
const port = address.port;
await new Promise((resolve, reject) =>
  reservation.close((error) => (error ? reject(error) : resolve(undefined))),
);
const env = {
  ...process.env,
  KAIRN_HTTP_PORT: String(port),
  KAIRN_PUBLIC_ORIGIN: `http://localhost:${port}`,
  KAIRN_MAILPIT_PORT: "0",
  KAIRN_POSTGRES_PASSWORD: "kairn-test-postgres",
  KAIRN_MIGRATOR_PASSWORD: "kairn-test-migrator",
  KAIRN_SERVER_DB_PASSWORD: "kairn-test-server",
  KAIRN_WORKER_DB_PASSWORD: "kairn-test-worker",
  KAIRN_MIGRATION_DATABASE_URL:
    "postgresql://kairn_migrator:kairn-test-migrator@postgres:5432/kairn",
  KAIRN_SERVER_DATABASE_URL: "postgresql://kairn_server:kairn-test-server@postgres:5432/kairn",
  KAIRN_WORKER_DATABASE_URL: "postgresql://kairn_worker:kairn-test-worker@postgres:5432/kairn",
  KAIRN_STORAGE_ACCESS_KEY: "kairn-test",
  KAIRN_STORAGE_SECRET_KEY: "kairn-test-storage",
};

/** @param {string[]} args @param {boolean} [capture] */
function docker(args, capture = false) {
  const result = spawnSync("docker", args, {
    env,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.status !== 0)
    throw new Error(
      `docker ${args.join(" ")} failed (${result.status})\n${result.stdout ?? ""}${result.stderr ?? ""}`,
    );
  return result.stdout;
}

for (const mode of ["development", "runtime"]) {
  const project = `kairn-verify-${mode}-${process.pid}`;
  const files =
    mode === "development"
      ? ["-f", "compose.yaml", "-f", "compose.override.yaml"]
      : ["-f", "compose.yaml", "-f", "infra/compose/production.yaml"];
  const base = ["compose", "--project-name", project, ...files];
  try {
    docker([...base, "config", "--quiet"]);
    docker([...base, "--profile", "tools", "build", "server", "worker", "migrate", "tooling"]);
    docker([...base, "up", "-d", "--wait", "--wait-timeout", "120"]);
    const status = await fetch(`http://127.0.0.1:${port}/api/v1/system`);
    assert.equal(status.status, 200);
    docker([
      ...base,
      "--profile",
      "tools",
      "run",
      "--rm",
      "--no-deps",
      "-e",
      `TEST_WEB_MODE=${mode}`,
      "tooling",
      "pnpm",
      "test:integration",
    ]);
    if (mode === "runtime") {
      const probe = `
import assert from 'node:assert/strict';
import { existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
for (const name of ['@kairn/backend', '@kairn/contracts', '@kairn/shared', '@kairn/sync-protocol', '@kairn/design-tokens', '@kairn/web/reader']) {
  await import(name);
  const path = realpathSync(fileURLToPath(import.meta.resolve(name)));
  assert.ok(path.startsWith('/app/'), path);
}
for (const name of ['vite', 'vite-plus', 'typescript', 'openapi-typescript', '@playwright/test']) {
  assert.throws(() => import.meta.resolve(name));
}
const backendRequire = createRequire(import.meta.resolve('@kairn/backend'));
for (const name of ['drizzle-kit', 'auth', '@kairn/identity-generation', 'gel', 'mysql2']) {
  assert.throws(() => backendRequire.resolve(name));
}
for (const path of ['src', 'apps', 'packages', 'tools', '.env']) assert.equal(existsSync(path), false, path);
assert.notEqual(process.getuid(), 0);
console.log('PASS isolated production runtime: compiled workspace closure, no source/dev dependencies, non-root.');
`;
      docker([
        ...base,
        "run",
        "--rm",
        "--no-deps",
        "server",
        "node",
        "--input-type=module",
        "-e",
        probe,
      ]);
      const config = JSON.parse(docker([...base, "config", "--format", "json"], true));
      assert.equal(config.services.server.read_only, true);
      assert.equal(config.services.server.volumes, undefined);
    }
    console.log(
      `PASS ${mode}: composed HTTP, SSR, hydration, lazy assets, isolation, and guarded delivery.`,
    );
  } catch (error) {
    spawnSync("docker", [...base, "logs", "--no-color", "--tail", "100"], {
      env,
      stdio: "inherit",
    });
    throw error;
  } finally {
    docker([...base, "--profile", "tools", "down", "--volumes", "--remove-orphans"]);
  }
}
