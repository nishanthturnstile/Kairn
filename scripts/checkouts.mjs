import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

/** @param {string} cwd @param {string[]} args @param {boolean} [optional] */
function git(cwd, args, optional = false) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 120_000,
  });
  if (result.error || (!optional && result.status !== 0))
    throw new Error(
      `Git ${args[0]} failed; no reset, cleanup or conflict resolution was attempted.`,
    );
  return { ok: result.status === 0, text: result.stdout ?? "" };
}

/** @param {string} text */
const paths = (text) => text.split("\0").filter(Boolean);

/** @param {string} [cwd] */
export function checkoutStatus(cwd = process.cwd()) {
  const root = git(cwd, ["rev-parse", "--show-toplevel"]).text.trim();
  const changes = paths(
    git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=normal"]).text,
  );
  return {
    root,
    branch: git(root, ["branch", "--show-current"]).text.trim() || "(detached)",
    head: git(root, ["rev-parse", "HEAD"]).text.trim(),
    clean: changes.length === 0,
    changes: changes.slice(0, 20),
    changeCount: changes.length,
  };
}

/** @param {string[]} local @param {string[]} target */
function collisions(local, target) {
  // Conservative on every host, including default case-insensitive Windows/macOS volumes.
  const normalize = (/** @type {string} */ name) =>
    name.normalize("NFC").toLowerCase().replace(/\/$/, "");
  const normalized = local.map(normalize);
  const sorted = normalized.sort();
  const set = new Set(normalized);
  return target.filter((original) => {
    const name = normalize(original);
    if (set.has(name)) return true;
    const pieces = name.split("/");
    for (let i = 1; i < pieces.length; i++) if (set.has(pieces.slice(0, i).join("/"))) return true;
    const prefix = `${name}/`;
    let low = 0,
      high = sorted.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if ((sorted[mid] ?? "") < prefix) low = mid + 1;
      else high = mid;
    }
    return sorted[low]?.startsWith(prefix) ?? false;
  });
}

/** @param {string} root @param {string[]} files */
function fingerprints(root, files) {
  return files
    .filter((file) => existsSync(path.join(root, file)))
    .map((file) => ({
      file,
      hash: createHash("sha256")
        .update(readFileSync(path.join(root, file)))
        .digest("hex"),
    }));
}

/**
 * Synchronize one clean checkout only. Does not push, install dependencies or control processes/devices.
 * @param {{cwd?: string, branch: string, commit?: string}} options
 */
export function syncCheckout({ cwd = process.cwd(), branch, commit }) {
  const before = checkoutStatus(cwd);
  if (!before.clean)
    throw new Error(
      "Checkout has pending work. Commit it on its owning feature branch or preserve/review it first; sync never stashes or discards it.",
    );
  if (
    !git(before.root, ["check-ref-format", "--branch", branch], true).ok ||
    branch.startsWith("-")
  )
    throw new Error("Invalid branch name.");
  if (commit && !/^[a-f0-9]{40}$/i.test(commit))
    throw new Error("Expected commit must be a full 40-character SHA.");
  const remote = git(before.root, ["remote", "get-url", "origin"]).text.trim();
  if (/^https?:\/\/[^/]*@/i.test(remote))
    throw new Error("Use Git's credential helper, not credentials embedded in origin.");
  const gitDir = git(before.root, ["rev-parse", "--absolute-git-dir"]).text.trim();
  const lock = path.join(gitDir, "kairn-checkout-sync.lock");
  const handle = openSync(lock, "wx");
  try {
    git(before.root, ["fetch", "origin"]);
    const remoteRef = `refs/remotes/origin/${branch}`;
    const target = git(before.root, ["rev-parse", "--verify", `${remoteRef}^{commit}`]).text.trim();
    if (commit && target !== commit.toLowerCase())
      throw new Error(
        "Remote branch tip differs from the requested commit. Resolve the checkpoint before syncing.",
      );
    const localRef = `refs/heads/${branch}`;
    const existing = git(before.root, ["show-ref", "--verify", "--quiet", localRef], true).ok;
    if (existing && !git(before.root, ["merge-base", "--is-ancestor", localRef, target], true).ok)
      throw new Error(
        "Local branch is ahead or diverged. Publish/reconcile its commits first; sync never resets a branch.",
      );
    // Include ignored files: Git must never overwrite an environment, signing file or local output.
    const untracked = paths(
      git(before.root, ["ls-files", "--others", "--directory", "--no-empty-directory", "-z"]).text,
    );
    const targetFiles = paths(
      git(before.root, ["ls-tree", "-r", "--name-only", "-z", target]).text,
    );
    const blocked = collisions(untracked, targetFiles);
    if (blocked.length)
      throw new Error(
        `Local untracked/ignored paths collide with target source: ${blocked.slice(0, 5).join(", ")}. Preserve and reconcile them manually.`,
      );
    const critical = [
      ...new Set([
        ".env",
        ".env.local",
        "apps/mobile/.env.local",
        ".kairn/env.ps1",
        ".kairn/env.sh",
        "apps/mobile/ios/KairnDev.xcodeproj/project.pbxproj",
        "apps/mobile/ios/KairnDev.xcworkspace/contents.xcworkspacedata",
        "apps/mobile/ios/Podfile.lock",
        "apps/mobile/ios/Pods/Manifest.lock",
        "apps/mobile/android/local.properties",
        "apps/mobile/android/app/debug.keystore",
        ...untracked.filter((file) => /\.(?:jks|keystore|p12|mobileprovision)$/.test(file)),
      ]),
    ];
    const protectedFiles = fingerprints(before.root, critical);
    const checkpoint = path.join(
      before.root,
      ".kairn",
      "checkout-backups",
      `${Date.now()}-${randomUUID()}`,
    );
    mkdirSync(checkpoint, { recursive: true });
    for (const { file } of protectedFiles) {
      const destination = path.join(checkpoint, file);
      mkdirSync(path.dirname(destination), { recursive: true });
      copyFileSync(path.join(before.root, file), destination);
    }
    const changed = paths(
      git(before.root, ["diff", "--name-only", "-z", before.head, target]).text,
    );
    writeFileSync(
      path.join(checkpoint, "manifest.json"),
      JSON.stringify({ before, target, protectedFiles }, null, 2) + "\n",
    );
    // Recheck before the first worktree mutation. Git itself also refuses pending tracked changes.
    if (!checkoutStatus(before.root).clean)
      throw new Error("Work appeared during preflight; stopped before checkout.");
    if (existing) git(before.root, ["checkout", "--no-overwrite-ignore", branch]);
    else
      git(before.root, ["checkout", "--no-overwrite-ignore", "--track", "-b", branch, remoteRef]);
    git(before.root, ["merge", "--ff-only", target]);
    git(before.root, ["branch", `--set-upstream-to=origin/${branch}`, branch]);
    const after = checkoutStatus(before.root);
    const preserved =
      JSON.stringify(protectedFiles) ===
      JSON.stringify(
        fingerprints(
          before.root,
          protectedFiles.map((item) => item.file),
        ),
      );
    if (!preserved || !after.clean || after.head !== target)
      throw new Error(
        `Post-sync verification failed. Preserve this checkout and inspect ${checkpoint}; no automatic rollback will overwrite concurrent work.`,
      );
    const result = {
      root: before.root,
      branch,
      before: before.head,
      head: target,
      clean: true,
      protectedFilesPreserved: protectedFiles.length,
      backup: checkpoint,
      changedFiles: changed,
      dependencyInputsChanged: changed.some((file) =>
        /(?:^|\/)(?:pnpm-lock\.yaml|pnpm-workspace\.yaml|\.node-version|\.npmrc|package\.json)$/.test(
          file,
        ),
      ),
      reviewNativeInputs: changed.some(
        (file) =>
          file === "pnpm-lock.yaml" ||
          /^apps\/mobile\/(?:package\.json|app\.json|native-locks\/)/.test(file),
      ),
    };
    const verification = path.join(before.root, ".kairn", "verification");
    mkdirSync(verification, { recursive: true });
    writeFileSync(
      path.join(verification, "checkout-sync.json"),
      JSON.stringify(result, null, 2) + "\n",
    );
    return result;
  } finally {
    closeSync(handle);
    unlinkSync(lock);
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const { values, positionals } = parseArgs({
      options: { branch: { type: "string" }, commit: { type: "string" } },
      allowPositionals: true,
    });
    const mode = positionals[0] ?? "status";
    if (positionals.length > 1 || !["status", "sync"].includes(mode))
      throw new Error(
        "Usage: node scripts/checkouts.mjs status | sync --branch NAME [--commit FULL_SHA]",
      );
    if (mode === "sync" && !values.branch)
      throw new Error("Sync requires --branch; there is no implicit branch switch.");
    const result =
      mode === "status"
        ? checkoutStatus()
        : syncCheckout({
            branch: values.branch ?? "",
            ...(values.commit ? { commit: values.commit } : {}),
          });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Checkout operation failed.");
    process.exitCode = 1;
  }
}
