import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vite-plus/test";
import { checkoutStatus, syncCheckout } from "../../scripts/checkouts.mjs";

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "kairn-checkout-"));
  const remote = path.join(root, "remote.git");
  const writer = path.join(root, "writer");
  const replica = path.join(root, "replica");
  const git = (cwd: string, ...args: string[]) =>
    execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(root, "init", "--bare", remote);
  git(root, "clone", remote, writer);
  git(writer, "config", "user.name", "Checkout fixture");
  git(writer, "config", "user.email", "checkout@example.invalid");
  git(writer, "checkout", "-b", "development");
  writeFileSync(path.join(writer, ".gitignore"), ".kairn/\n.env\nlocal-only.txt\n");
  writeFileSync(path.join(writer, "source.txt"), "initial\n");
  git(writer, "add", ".gitignore", "source.txt");
  git(writer, "commit", "-m", "initial");
  git(writer, "push", "-u", "origin", "development");
  git(root, "clone", "-b", "development", remote, replica);
  const head = git(replica, "rev-parse", "HEAD");
  const advance = () => {
    writeFileSync(path.join(writer, "source.txt"), "updated\n");
    git(writer, "commit", "-am", "update");
    git(writer, "push", "origin", "development");
    return git(writer, "rev-parse", "HEAD");
  };
  const cleanup = () => {
    const resolved = realpathSync(root);
    if (
      path.dirname(resolved) !== realpathSync(tmpdir()) ||
      !path.basename(resolved).startsWith("kairn-checkout-")
    )
      throw new Error("Unsafe fixture cleanup target");
    rmSync(resolved, { recursive: true, force: true });
  };
  return { root, remote, writer, replica, git, head, advance, cleanup };
}

it("fast-forwards an exact remote checkpoint and preserves local secrets/output", () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.replica, ".env"), "PRIVATE_FIXTURE\n");
    mkdirSync(path.join(f.replica, ".kairn"));
    writeFileSync(path.join(f.replica, ".kairn", "env.sh"), "LOCAL_TOOL_FIXTURE\n");
    const target = f.advance();
    const result = syncCheckout({ cwd: f.replica, branch: "development", commit: target });
    expect(result.head).toBe(target);
    expect(result.protectedFilesPreserved).toBe(2);
    expect(readFileSync(path.join(f.replica, ".env"), "utf8")).toBe("PRIVATE_FIXTURE\n");
    expect(readFileSync(path.join(f.replica, "source.txt"), "utf8")).toBe("updated\n");
    expect(checkoutStatus(f.replica).clean).toBe(true);
  } finally {
    f.cleanup();
  }
});

it.each(["tracked", "staged", "untracked"])("refuses %s work without modifying it", (kind) => {
  const f = fixture();
  try {
    f.advance();
    const file = kind === "untracked" ? "new-source.txt" : "source.txt";
    writeFileSync(path.join(f.replica, file), "UNCOMMITTED_FIXTURE\n");
    if (kind === "staged") f.git(f.replica, "add", file);
    expect(() => syncCheckout({ cwd: f.replica, branch: "development" })).toThrow("pending work");
    expect(f.git(f.replica, "rev-parse", "HEAD")).toBe(f.head);
    expect(readFileSync(path.join(f.replica, file), "utf8")).toBe("UNCOMMITTED_FIXTURE\n");
  } finally {
    f.cleanup();
  }
});

it("rejects a moved remote tip and unpublished/divergent local commits", () => {
  const f = fixture();
  try {
    f.advance();
    expect(() => syncCheckout({ cwd: f.replica, branch: "development", commit: f.head })).toThrow(
      "differs",
    );
    f.git(f.replica, "config", "user.name", "Checkout fixture");
    f.git(f.replica, "config", "user.email", "checkout@example.invalid");
    writeFileSync(path.join(f.replica, "local.txt"), "local committed work\n");
    f.git(f.replica, "add", "local.txt");
    f.git(f.replica, "commit", "-m", "local work");
    const local = f.git(f.replica, "rev-parse", "HEAD");
    expect(() => syncCheckout({ cwd: f.replica, branch: "development" })).toThrow(
      "ahead or diverged",
    );
    expect(f.git(f.replica, "rev-parse", "HEAD")).toBe(local);
  } finally {
    f.cleanup();
  }
});

it("refuses ignored-file collisions and never overwrites the local copy", () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.replica, "local-only.txt"), "HOST_ONLY\n");
    writeFileSync(path.join(f.writer, "local-only.txt"), "REMOTE_SOURCE\n");
    f.git(f.writer, "add", "-f", "local-only.txt");
    f.git(f.writer, "commit", "-m", "source collision");
    f.git(f.writer, "push", "origin", "development");
    expect(() => syncCheckout({ cwd: f.replica, branch: "development" })).toThrow("collide");
    expect(readFileSync(path.join(f.replica, "local-only.txt"), "utf8")).toBe("HOST_ONLY\n");
    expect(f.git(f.replica, "rev-parse", "HEAD")).toBe(f.head);
    expect(existsSync(path.join(f.replica, ".git", "kairn-checkout-sync.lock"))).toBe(false);
  } finally {
    f.cleanup();
  }
});

it("creates a tracking feature branch and leaves the previous branch intact", () => {
  const f = fixture();
  try {
    f.git(f.writer, "checkout", "-b", "feat/account");
    writeFileSync(path.join(f.writer, "feature.txt"), "feature\n");
    f.git(f.writer, "add", "feature.txt");
    f.git(f.writer, "commit", "-m", "feature");
    f.git(f.writer, "push", "origin", "feat/account");
    const target = f.git(f.writer, "rev-parse", "HEAD");
    const result = syncCheckout({ cwd: f.replica, branch: "feat/account", commit: target });
    expect(result.branch).toBe("feat/account");
    expect(f.git(f.replica, "rev-parse", "development")).toBe(f.head);
  } finally {
    f.cleanup();
  }
});

it("refuses failed fetch and case-only ignored collisions without moving HEAD", () => {
  const f = fixture();
  try {
    f.git(f.replica, "remote", "set-url", "origin", path.join(f.root, "missing.git"));
    expect(() => syncCheckout({ cwd: f.replica, branch: "development" })).toThrow("fetch failed");
    expect(f.git(f.replica, "rev-parse", "HEAD")).toBe(f.head);
    f.git(f.replica, "remote", "set-url", "origin", f.remote);
    writeFileSync(path.join(f.replica, "local-only.txt"), "HOST_ONLY\n");
    writeFileSync(path.join(f.writer, "LOCAL-ONLY.txt"), "REMOTE_SOURCE\n");
    f.git(f.writer, "add", "-f", "LOCAL-ONLY.txt");
    f.git(f.writer, "commit", "-m", "case collision");
    f.git(f.writer, "push", "origin", "development");
    expect(() => syncCheckout({ cwd: f.replica, branch: "development" })).toThrow("collide");
    expect(readFileSync(path.join(f.replica, "local-only.txt"), "utf8")).toBe("HOST_ONLY\n");
  } finally {
    f.cleanup();
  }
});

it("preserves an ignored directory when target source wants a file at that path", () => {
  const f = fixture();
  try {
    mkdirSync(path.join(f.replica, "local-only.txt"));
    writeFileSync(path.join(f.replica, "local-only.txt", "private.txt"), "PRESERVE_DIRECTORY\n");
    writeFileSync(path.join(f.writer, "local-only.txt"), "REMOTE_FILE\n");
    f.git(f.writer, "add", "-f", "local-only.txt");
    f.git(f.writer, "commit", "-m", "file directory collision");
    f.git(f.writer, "push", "origin", "development");
    expect(() => syncCheckout({ cwd: f.replica, branch: "development" })).toThrow("collide");
    expect(readFileSync(path.join(f.replica, "local-only.txt", "private.txt"), "utf8")).toBe(
      "PRESERVE_DIRECTORY\n",
    );
    expect(f.git(f.replica, "rev-parse", "HEAD")).toBe(f.head);
  } finally {
    f.cleanup();
  }
});
