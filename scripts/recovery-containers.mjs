import { setTimeout } from "node:timers/promises";

/**
 * Start only the inspected immutable container identities. Compose configuration
 * can change after inspection, so release must never reconcile/recreate services.
 * @param {(args: string[]) => string} docker
 * @param {{Id: string, Image: string, Config: {Env: string[] | null}}[]} checked
 * @param {number} [timeoutMs]
 */
export async function startCheckedContainers(docker, checked, timeoutMs = 60_000) {
  const ids = checked.map((container) => container.Id);
  if (
    !ids.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !/^[a-f0-9]{64}$/.test(id))
  )
    throw new Error("Invalid checked container inventory.");
  const inspect = () => {
    const current = JSON.parse(docker(["inspect", ...ids]));
    if (!Array.isArray(current) || current.length !== checked.length)
      throw new Error("Checked container inventory changed.");
    for (const expected of checked) {
      const actual = current.find((container) => container.Id === expected.Id);
      if (
        !actual ||
        actual.Image !== expected.Image ||
        JSON.stringify(actual.Config.Env) !== JSON.stringify(expected.Config.Env)
      )
        throw new Error("Checked container inputs changed.");
    }
    return current;
  };
  inspect(); // Missing identities fail before any remaining container starts.
  docker(["start", ...ids]);
  const deadline = Date.now() + timeoutMs;
  while (true) {
    const current = inspect();
    if (
      current.some(
        (container) => !container.State.Running || container.State.Health?.Status === "unhealthy",
      )
    )
      throw new Error("Checked container failed to become ready.");
    if (
      current.every(
        (container) => !container.State.Health || container.State.Health.Status === "healthy",
      )
    )
      return;
    if (Date.now() >= deadline) throw new Error("Checked container readiness timed out.");
    await setTimeout(250);
  }
}
