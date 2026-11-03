import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve, join, isAbsolute } from "node:path";
import { createDatabasePool } from "@kairn/backend/database";
import { HttpRestrictionJournal } from "@kairn/backend/journal";
import {
  fenceDatabaseWriters,
  rotateWriterCredentials,
  releaseDatabaseWriters,
  replayRestrictions,
  inspectOperation,
  OperatorConfigSchema,
  DockerContainersSchema,
  FenceStateSchema,
  ReleaseEvidenceSchema,
  WriterPasswordsSchema,
  JournalHeadSchema,
} from "@kairn/backend/recovery";

// Controlled operator CLI. Never imports an application .env or prints a credential/error row.
const [action, configPath] = process.argv.slice(2);
/** @param {string} path @returns {Promise<unknown>} */
async function privateJson(path) {
  const info = await stat(path);
  if (!info.isFile() || info.size > 65536 || (info.mode & 0o077) !== 0)
    throw new Error("A private bounded operator file is required.");
  return JSON.parse(await readFile(path, "utf8"));
}
let pool;
/** @type {(() => Promise<void>) | undefined} */
let emergencyFence;
try {
  if (
    !action ||
    !configPath ||
    !["fence", "head", "replay", "rotate", "release", "inspect"].includes(action)
  )
    throw new Error(
      "Usage: pnpm recovery -- fence|head|replay|rotate|release|inspect PRIVATE_CONFIG_FILE",
    );
  const config = OperatorConfigSchema.parse(await privateJson(configPath));
  if (
    !/^[a-z0-9][a-z0-9_-]+$/.test(config.composeProject) ||
    !isAbsolute(config.fenceDirectory) ||
    !Array.isArray(config.composeFiles) ||
    !config.composeFiles.length
  )
    throw new Error("Invalid operator deployment inventory.");
  const directory = resolve(config.fenceDirectory);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const statePath = join(directory, "fence.json");
  const headPath = join(directory, "independent-head.json");
  const base = [
    "compose",
    "--project-name",
    config.composeProject,
    ...config.composeFiles.flatMap((path) => ["-f", resolve(path)]),
  ];
  /** @param {string[]} args */
  const docker = (args) =>
    execFileSync("docker", args, { encoding: "utf8", maxBuffer: 1024 * 1024 });
  /** @param {Record<string,unknown>} state */
  const record = async (state) =>
    writeFile(statePath, JSON.stringify(state, null, 2), { mode: 0o600 });
  pool = createDatabasePool(config.operatorDatabaseUrl, "kairn-controlled-recovery", 1);
  const operator = pool;
  emergencyFence = async () => {
    docker([...base, "stop", "edge", "server", "worker"]);
    await fenceDatabaseWriters(operator);
    const keys = new Map(
      Object.entries(config.journal.keys).map(([id, value]) => [
        id,
        Buffer.from(value, "base64url"),
      ]),
    );
    await new HttpRestrictionJournal(
      new URL(config.journal.endpoint),
      config.journal.token,
      keys,
    ).fence();
  };
  if (action === "fence") {
    // External gate exists before touching DB; a failed fence keeps the edge stopped.
    await writeFile(
      statePath,
      JSON.stringify({ state: "closing", startedAt: new Date().toISOString() }),
      { flag: "wx", mode: 0o600 },
    );
    const ids = docker([...base, "ps", "--all", "--quiet", "edge", "server", "worker"])
      .trim()
      .split("\n")
      .filter(Boolean);
    if (ids.length) docker(["update", "--restart=no", ...ids]);
    docker([...base, "stop", "edge", "server", "worker"]);
    await fenceDatabaseWriters(pool);
    const containers = ids.length
      ? DockerContainersSchema.parse(JSON.parse(docker(["inspect", ...ids]))).map((c) => ({
          id: c.Id,
          image: c.Image,
          running: c.State.Running,
          restart: c.HostConfig.RestartPolicy.Name,
        }))
      : [];
    if (containers.length !== 3 || containers.some((c) => c.running || c.restart !== "no"))
      throw new Error("A deployment writer remains running or restartable.");
    await record({ state: "fenced", startedAt: new Date().toISOString(), containers });
  } else if (action === "inspect") {
    if (!config.inspection) throw new Error("An inspection purpose and case are required.");
    console.log(JSON.stringify(await inspectOperation(pool, config.inspection)));
  } else {
    const state = FenceStateSchema.parse(await privateJson(statePath));
    if (!["fenced", "replayed", "rotated"].includes(state.state))
      throw new Error("External delivery fence is not established.");
    const keys = new Map(
      Object.entries(config.journal.keys).map(([id, value]) => [
        id,
        Buffer.from(value, "base64url"),
      ]),
    );
    const journal = new HttpRestrictionJournal(
      new URL(config.journal.endpoint),
      config.journal.token,
      keys,
    );
    if (action === "head") {
      await journal.fence();
      const entries = await journal.read();
      await writeFile(
        headPath,
        JSON.stringify({
          sequence: entries.length,
          checkpointSha256: entries.at(-1)?.checkpointSha256 ?? "0".repeat(64),
        }),
        { mode: 0o600 },
      );
    } else if (action === "replay") {
      await fenceDatabaseWriters(pool); // Reapply after restore; never trust restored login flags.
      const expected = JournalHeadSchema.parse(await privateJson(headPath));
      await replayRestrictions(pool, journal, keys, expected);
      await record({ ...state, state: "replayed", head: expected });
    } else if (action === "rotate") {
      if (state.state !== "replayed")
        throw new Error("Replay is required before credential rotation.");
      await rotateWriterCredentials(
        pool,
        WriterPasswordsSchema.parse(await privateJson(config.newWriterPasswordsFile)),
      );
      await record({ ...state, state: "rotated" });
    } else {
      if (state.state !== "rotated" || !state.head)
        throw new Error("New writer credentials are required before release.");
      const evidence = ReleaseEvidenceSchema.parse(await privateJson(config.releaseEvidenceFile));
      if (
        evidence.sequence !== state.head.sequence ||
        evidence.checkpointSha256 !== state.head.checkpointSha256 ||
        evidence.oldWriterCommitRejected !== true ||
        evidence.oldWriterReconnectRejected !== true ||
        evidence.objectIntegrityVerified !== true ||
        !/^[a-f0-9]{40}$/.test(evidence.sourceCommit)
      )
        throw new Error("Release evidence is incomplete.");
      const containers = DockerContainersSchema.parse(
        JSON.parse(
          docker([
            "inspect",
            ...docker([...base, "ps", "--all", "--quiet", "server", "worker"])
              .trim()
              .split("\n")
              .filter(Boolean),
          ]),
        ),
      );
      if (
        containers.length !== 2 ||
        containers.some((c) => c.State.Running || !evidence.compatibleImages.includes(c.Image))
      )
        throw new Error("Only checked compatible stopped images may be admitted.");
      const passwords = WriterPasswordsSchema.parse(
        await privateJson(config.newWriterPasswordsFile),
      );
      for (const container of containers) {
        const value = container.Config.Env?.find((value) => value.startsWith("DATABASE_URL="));
        if (!value) throw new Error("A current writer credential mount is required.");
        const url = new URL(value.slice("DATABASE_URL=".length));
        const expected =
          url.username === "kairn_server"
            ? passwords.kairn_server
            : url.username === "kairn_worker"
              ? passwords.kairn_worker
              : undefined;
        if (!expected || decodeURIComponent(url.password) !== expected)
          throw new Error("A stale deployment credential remains mounted.");
      }
      // Re-read the independent fresh head; an appended restriction makes the old proof stale.
      const entries = await journal.read();
      if (
        entries.length !== state.head.sequence ||
        (entries.at(-1)?.checkpointSha256 ?? "0".repeat(64)) !== state.head.checkpointSha256
      )
        throw new Error("Independent head advanced; replay again.");
      await releaseDatabaseWriters(pool, state.head);
      const tokenFile = await stat(config.newJournalAppenderTokenFile);
      if (!tokenFile.isFile() || (tokenFile.mode & 0o077) !== 0 || tokenFile.size > 512)
        throw new Error("A private next-generation appender credential is required.");
      const nextToken = (await readFile(config.newJournalAppenderTokenFile, "utf8")).trim();
      await journal.resume(nextToken);
      docker([
        ...base,
        "up",
        "--detach",
        "--wait",
        "--wait-timeout",
        "60",
        "--no-deps",
        "--pull",
        "never",
        "server",
        "worker",
      ]);
      docker([...base, "up", "--detach", "--no-deps", "--pull", "never", "edge"]);
      await record({
        ...state,
        state: "released",
        releasedAt: new Date().toISOString(),
        sourceCommit: evidence.sourceCommit,
      });
    }
  }
  console.log(`Recovery ${action} completed.`);
} catch {
  if (action === "release") await emergencyFence?.().catch(() => {});
  console.error(
    "Recovery action failed. Keep delivery and writers fenced; inspect the private operator evidence.",
  );
  process.exitCode = 1;
} finally {
  await pool?.end();
}
