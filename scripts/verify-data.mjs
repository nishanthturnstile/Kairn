import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

// Host-only orchestration. Test containers have no Docker socket.
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
  // Never follow a developer's connection URLs or credentials into a shared service.
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
const runId = randomUUID();
const project = `kairn-data-${process.pid}`;
const base = [
  "compose",
  "--project-name",
  project,
  "-f",
  "compose.yaml",
  "-f",
  "infra/compose/production.yaml",
  "-f",
  "infra/compose/data-test.yaml",
];

/** @param {string[]} args @param {{capture?: boolean, fail?: boolean, environment?: NodeJS.ProcessEnv}} [options] */
function docker(args, options = {}) {
  const result = spawnSync("docker", [...base, ...args], {
    env: options.environment ?? env,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (options.fail) assert.notEqual(result.status, 0, "Expected the migration gate to fail.");
  else if (result.status !== 0)
    throw new Error(`Compose command failed: ${args.join(" ")}\n${result.stderr ?? ""}`);
  return result.stdout;
}
/** @param {() => Promise<boolean>} check */
async function eventually(check) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(500);
  }
  throw new Error("Timed out waiting for the service readiness transition.");
}
/** @param {string} phase */
function dataTests(phase) {
  docker([
    "--profile",
    "tools",
    "run",
    "--rm",
    "--no-deps",
    "-e",
    `TEST_RUN_ID=${runId}`,
    "-e",
    `TEST_DATA_PHASE=${phase}`,
    "tooling",
    "pnpm",
    "test:data",
  ]);
}
try {
  const config = JSON.parse(docker(["config", "--format", "json"], { capture: true }));
  for (const service of ["postgres", "storage", "worker", "migrate", "mailpit"])
    assert.ok(
      !config.services[service].ports?.length,
      `${service} must not publish ports in acceptance.`,
    );
  for (const service of ["server", "worker"]) {
    assert.equal(config.services[service].read_only, true);
    assert.equal(config.services[service].volumes, undefined);
    assert.equal(config.services[service].environment.MIGRATION_DATABASE_URL, undefined);
  }
  docker(["--profile", "tools", "build", "server", "worker", "migrate", "tooling"]);
  // Exercise the real bootstrap failure and Compose dependency gate on an empty database.
  docker(["up", "-d", "--wait", "--wait-timeout", "120"], {
    fail: true,
    environment: {
      ...env,
      KAIRN_MIGRATION_DATABASE_URL: "postgresql://kairn_migrator:invalid@postgres:5432/kairn",
    },
  });
  const migrationId = docker(["ps", "--all", "--quiet", "migrate"], { capture: true }).trim();
  const migrationState = spawnSync(
    "docker",
    ["inspect", "--format", "{{.State.Status}} {{.State.ExitCode}}", migrationId],
    { encoding: "utf8" },
  );
  assert.equal(
    migrationState.stdout.trim(),
    "exited 1",
    "The bootstrap process must fail before checking its dependents.",
  );
  for (const service of ["server", "worker"]) {
    const id = docker(["ps", "--all", "--quiet", service], { capture: true }).trim();
    if (id) {
      const result = spawnSync("docker", ["inspect", "--format", "{{.State.Running}}", id], {
        encoding: "utf8",
      });
      assert.equal(result.stdout.trim(), "false", `${service} started after a failed migration.`);
    }
  }
  console.log("PASS failed migration blocks application startup.");
  docker(["up", "-d", "--wait", "--wait-timeout", "120"]);
  docker(["run", "--rm", "--no-deps", "migrate"]); // Repeat bootstrap must preserve existing state.
  dataTests("seed");
  docker(["stop", "postgres"]);
  await eventually(
    async () => (await fetch(`http://localhost:${port}/health/ready`)).status === 503,
  );
  assert.equal((await fetch(`http://localhost:${port}/health/live`)).status, 200);
  const workerId = docker(["ps", "--quiet", "worker"], { capture: true }).trim();
  await eventually(async () => {
    const result = spawnSync(
      "docker",
      ["inspect", "--format", "{{.State.Health.Status}}", workerId],
      { encoding: "utf8" },
    );
    return result.stdout.trim() === "unhealthy";
  });
  console.log(
    "PASS database outage removes server and worker readiness while liveness stays available.",
  );
  // Recreate containers, preserving the project's named volumes. Existing processes must reconnect.
  docker([
    "up",
    "-d",
    "--force-recreate",
    "--wait",
    "--wait-timeout",
    "120",
    "postgres",
    "storage",
  ]);
  await eventually(async () => (await fetch(`http://localhost:${port}/health/ready`)).ok);
  await eventually(async () => {
    const result = spawnSync(
      "docker",
      ["inspect", "--format", "{{.State.Health.Status}}", workerId],
      { encoding: "utf8" },
    );
    return result.stdout.trim() === "healthy";
  });
  dataTests("verify");
  docker(["--profile", "tools", "run", "--rm", "--no-deps", "tooling", "pnpm", "test:integration"]);
  docker([
    "run",
    "--rm",
    "--no-deps",
    "worker",
    "node",
    "--input-type=module",
    "-e",
    `
    import assert from 'node:assert/strict';
    import { existsSync } from 'node:fs';
    import { createRequire } from 'node:module';
    await import('@kairn/backend/queue');
    for (const name of ['vite-plus', 'typescript', '@playwright/test']) assert.throws(() => import.meta.resolve(name));
    const backendRequire = createRequire(import.meta.resolve('@kairn/backend/queue'));
    for (const name of ['drizzle-kit', 'auth', '@kairn/identity-generation', 'gel', 'mysql2']) assert.throws(() => backendRequire.resolve(name));
    for (const path of ['src', 'apps', 'packages', 'tools', '.env']) assert.equal(existsSync(path), false);
    assert.notEqual(process.getuid(), 0);
    assert.equal(process.env.MIGRATION_DATABASE_URL, undefined);
    console.log('PASS compiled non-root worker runtime without source, development tools, or migration credentials.');
  `,
  ]);
  console.log(
    "PASS data foundation: migration gate, recovery, durable queue, private persistent storage, and local SMTP.",
  );
} catch (error) {
  docker(["logs", "--no-color", "--tail", "60"]);
  throw error;
} finally {
  // Only disposable resources owned by this invocation are removed.
  docker(["--profile", "tools", "down", "--volumes", "--remove-orphans"]);
}
