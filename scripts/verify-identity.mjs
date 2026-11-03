import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

// A new project/volume only; never connects to or resets the developer's application database.
const project = `kairn-identity-${randomUUID().slice(0, 8)}`;
const base = [
  "compose",
  "--project-name",
  project,
  "-f",
  "compose.yaml",
  "-f",
  "infra/compose/production.yaml",
  "-f",
  "infra/compose/identity-test.yaml",
];
const env = {
  ...process.env,
  KAIRN_POSTGRES_PASSWORD: "kairn-identity-test",
  KAIRN_MIGRATOR_PASSWORD: "kairn-identity-migrator",
  KAIRN_SERVER_DB_PASSWORD: "kairn-identity-api",
  KAIRN_WORKER_DB_PASSWORD: "kairn-identity-worker",
  KAIRN_AUTH_DB_PASSWORD: "kairn-identity-auth",
};
/** @param {string[]} args */
function docker(args) {
  const result = spawnSync("docker", [...base, ...args], { env, stdio: "inherit" });
  assert.equal(result.status, 0, `Identity verification command failed: ${args[0]}`);
}
try {
  docker(["up", "-d", "--wait", "--wait-timeout", "120", "postgres"]);
  docker([
    "--profile",
    "tools",
    "run",
    "--build",
    "--rm",
    "--no-deps",
    "-e",
    "TEST_IDENTITY_ISOLATED=1",
    "-e",
    "TEST_MIGRATION_DATABASE_URL=postgresql://kairn_migrator:kairn-identity-migrator@postgres:5432/kairn",
    "-e",
    "TEST_SERVER_DATABASE_URL=postgresql://kairn_server:kairn-identity-api@postgres:5432/kairn",
    "-e",
    "TEST_AUTH_DATABASE_URL=postgresql://kairn_auth:kairn-identity-auth@postgres:5432/kairn",
    "-e",
    "TEST_WORKER_DATABASE_URL=postgresql://kairn_worker:kairn-identity-worker@postgres:5432/kairn",
    "tooling",
    "pnpm",
    "test:identity",
  ]);
  console.log(
    "PASS isolated identity migrations, provisioning, RLS and enqueue-only producer boundary.",
  );
} finally {
  docker(["--profile", "tools", "down", "--volumes", "--remove-orphans"]);
}
