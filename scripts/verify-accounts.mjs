import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const artifacts = resolve(".kairn/verification/b04/browser-artifacts");
mkdirSync(artifacts, { recursive: true });
const project = `kairn-domain-${randomUUID().slice(0, 8)}`;
const container = `${project}-accounts`;
let passed = false;
const base = [
  "compose",
  "--project-name",
  project,
  "-f",
  "compose.yaml",
  "-f",
  "infra/compose/production.yaml",
  "-f",
  "infra/compose/domain-test.yaml",
  "-f",
  "infra/compose/accounts-test.yaml",
];
const env = {
  ...process.env,
  KAIRN_DOMAIN_TEST_PROJECT: project,
  KAIRN_POSTGRES_PASSWORD: "kairn-domain-postgres",
  KAIRN_MIGRATOR_PASSWORD: "kairn-domain-migrator",
  KAIRN_SERVER_DB_PASSWORD: "kairn-domain-server",
  KAIRN_AUTH_DB_PASSWORD: "kairn-domain-auth",
  KAIRN_WORKER_DB_PASSWORD: "kairn-domain-worker",
  KAIRN_STORAGE_ACCESS_KEY: "kairn-domain",
  KAIRN_STORAGE_SECRET_KEY: "kairn-domain-storage",
};
/** @param {string[]} args */
function docker(args) {
  const result = spawnSync("docker", [...base, ...args], { env, stdio: "inherit" });
  assert.equal(result.status, 0, "Domain verification command failed.");
}
try {
  docker(["up", "--detach", "--wait", "--wait-timeout", "120", "postgres", "storage", "mailpit"]);
  const testEnv = {
    TEST_DOMAIN_ISOLATED: "1",
    TEST_DOMAIN_TEST_PROJECT: project,
    TEST_ADMIN_DATABASE_URL: "postgresql://postgres:kairn-domain-postgres@postgres:5432/postgres",
    TEST_MIGRATION_DATABASE_URL:
      "postgresql://kairn_migrator:kairn-domain-migrator@postgres:5432/kairn",
    TEST_SERVER_DATABASE_URL: "postgresql://kairn_server:kairn-domain-server@postgres:5432/kairn",
    TEST_AUTH_DATABASE_URL: "postgresql://kairn_auth:kairn-domain-auth@postgres:5432/kairn",
    TEST_WORKER_DATABASE_URL: "postgresql://kairn_worker:kairn-domain-worker@postgres:5432/kairn",
    TEST_STORAGE_ENDPOINT: "http://storage:8333",
    TEST_STORAGE_ACCESS_KEY: "kairn-domain",
    TEST_STORAGE_SECRET_KEY: "kairn-domain-storage",
    TEST_MAILPIT_URL: "http://mailpit:8025",
    TEST_SMTP_HOST: "mailpit",
  };
  docker([
    "--profile",
    "tools",
    "run",
    "--build",
    "--name",
    container,
    "--no-deps",
    ...Object.entries(testEnv).flatMap(([name, value]) => ["-e", `${name}=${value}`]),
    "tooling",
    "pnpm",
    "test:accounts",
  ]);
  passed = true;
} finally {
  // Copy artifacts as the host caller; a runner-owned bind mount may have a
  // different UID from the non-root test container. Retain failure screenshots too.
  const captured = spawnSync(
    "docker",
    ["cp", `${container}:/app/test-results/accounts/.`, artifacts],
    {
      env,
      stdio: "inherit",
    },
  );
  docker(["--profile", "tools", "down", "--volumes", "--remove-orphans"]);
  if (passed) assert.equal(captured.status, 0, "Account browser artifacts were not retained.");
}
console.log(
  "PASS real account browser/auth/profile/session/mail/storage flow and retained screenshots.",
);
