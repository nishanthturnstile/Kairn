import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startCheckedContainers } from "./recovery-containers.mjs";

/** Real Docker boundary, no ports, credentials, shared project or Docker socket in a container.
 * @param {string} imageId */
export async function verifyRecoveryContainerRelease(imageId) {
  assert.match(imageId, /^sha256:[a-f0-9]{64}$/);
  const directory = await mkdtemp(join(tmpdir(), "kairn-release-"));
  const file = join(directory, "compose.json");
  const project = `kairn-release-${randomUUID().slice(0, 8)}`;
  /** @param {string[]} args */
  const docker = (args) =>
    execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const base = ["compose", "--project-name", project, "-f", file];
  /** @param {string} input */
  const configure = (input) =>
    writeFile(
      file,
      JSON.stringify({
        services: Object.fromEntries(
          ["server", "worker", "edge"].map((name) => [
            name,
            {
              image: imageId,
              restart: "no",
              network_mode: "none",
              environment: { REVIEW_INPUT: input },
              entrypoint: ["node", "-e", "setInterval(()=>{},1000)"],
              healthcheck: {
                test: ["CMD", "node", "-e", "process.exit(0)"],
                interval: "1s",
                timeout: "2s",
                retries: 5,
              },
            },
          ]),
        ),
      }),
    );
  try {
    await configure("checked");
    docker([...base, "create"]);
    const ids = docker([...base, "ps", "--all", "--quiet"])
      .trim()
      .split("\n");
    /** @type {{Id:string,Image:string,Config:{Env:string[],Labels:Record<string,string>},State:{Running:boolean}}[]} */
    const checked = JSON.parse(docker(["inspect", ...ids]));
    const writers = checked.filter((c) => c.Config.Labels["com.docker.compose.service"] !== "edge");
    const edge = checked.filter((c) => c.Config.Labels["com.docker.compose.service"] === "edge");
    const [first, second] = writers;
    const [front] = edge;
    assert.ok(first && second && front);
    await configure("stale-replacement");
    await startCheckedContainers(docker, writers);
    assert.equal(JSON.parse(docker(["inspect", front.Id]))[0].State.Running, false);
    await startCheckedContainers(docker, edge);
    /** @type {typeof checked} */
    const running = JSON.parse(docker(["inspect", ...ids]));
    assert.equal(running.length, 3);
    assert.ok(
      running.every((c) => c.State.Running && c.Config.Env.includes("REVIEW_INPUT=checked")),
    );
    docker(["stop", ...ids]);
    docker(["rm", first.Id]);
    await assert.rejects(startCheckedContainers(docker, writers));
    assert.equal(JSON.parse(docker(["inspect", second.Id]))[0].State.Running, false);
    assert.equal(
      docker([...base, "ps", "--all", "--quiet"])
        .trim()
        .split("\n").length,
      2,
    );
    console.log(
      "PASS recovery starts exact checked identities despite changed Compose inputs and fails closed on missing containers.",
    );
  } finally {
    try {
      docker([...base, "down", "--volumes", "--remove-orphans"]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
