import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
const project = `kairn-domain-${randomUUID().slice(0, 8)}`;
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
    "--rm",
    "--no-deps",
    ...Object.entries(testEnv).flatMap(([name, value]) => ["-e", `${name}=${value}`]),
    "tooling",
    "pnpm",
    "test:domain",
  ]);
  docker(["build", "worker"]);
  const image = readFileSync(
    new URL("../tests/fixtures/identity/avatar-metadata.png", import.meta.url),
  ).toString("base64");
  docker([
    "run",
    "--rm",
    "--no-deps",
    "worker",
    "node",
    "--input-type=module",
    "-e",
    `import {sanitizeAvatar} from "@kairn/backend/media";const result=await sanitizeAvatar(Buffer.from("${image}","base64"));if(result.width!==64||result.height!==32||result.bytes.includes(Buffer.from("Private Place")))process.exit(1);console.log("PASS packaged non-root bounded avatar decoder.");`,
  ]);
  console.log(
    "PASS isolated B03 commands, workers, private media, mail and controlled restriction recovery.",
  );
} finally {
  docker(["--profile", "tools", "down", "--volumes", "--remove-orphans"]);
}
