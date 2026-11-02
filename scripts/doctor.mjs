import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { release } from "node:os";
import { join } from "node:path";

const metadata = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const roles = ["wsl", "tooling", "android", "ios"];
const role =
  process.argv[2] ??
  (process.platform === "win32"
    ? "android"
    : process.platform === "darwin"
      ? "ios"
      : /microsoft/i.test(release()) && !existsSync("/.dockerenv")
        ? "wsl"
        : "tooling");
if (!roles.includes(role)) {
  console.error(`Usage: pnpm run doctor [${roles.join("|")}]`);
  process.exit(1);
}

let failures = 0;
/** @param {string} label @param {boolean} ok @param {string} detail */
function report(label, ok, detail) {
  console.log(`${ok ? "OK" : "MISSING"} ${label}: ${detail}`);
  if (!ok) failures++;
}
/** @param {string} command @param {string[]} args */
function commandVersion(command, args) {
  // Windows package-manager shims need cmd.exe; all arguments here are fixed.
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: process.platform === "win32" && command === "pnpm",
    timeout: 15_000,
  });
  return {
    ok: result.status === 0,
    output:
      (result.stdout || result.stderr || result.error?.message || "command unavailable")
        .trim()
        .split("\n")[0] ?? "",
  };
}
/** @param {string} label @param {string} command @param {string[]} args */
function inspect(label, command, args) {
  const result = commandVersion(command, args);
  report(label, result.ok, result.output);
}

console.log(`Kairn doctor — role ${role}, ${process.platform}/${process.arch}`);
report(
  "Node",
  process.versions.node === metadata.engines.node,
  `${process.versions.node}; required ${metadata.engines.node}`,
);
const manager = commandVersion("pnpm", ["--version"]);
report(
  "pnpm",
  manager.ok && manager.output === metadata.engines.pnpm,
  `${manager.output}; required ${metadata.engines.pnpm}`,
);
inspect("Vite+", "pnpm", ["exec", "vp", "--version"]);
if (role === "wsl") {
  report("WSL host", process.platform === "linux" && /microsoft/i.test(release()), release());
  inspect("Docker Compose", "docker", ["compose", "version"]);
  inspect("Docker daemon", "docker", ["info", "--format", "{{.ServerVersion}}"]);
}
if (role === "android") {
  report("Windows native host", process.platform === "win32", process.platform);
  const java = commandVersion("java", ["-version"]);
  report("JDK 17", java.ok && /version "17[."]/.test(java.output), java.output);
  report(
    "Android SDK",
    Boolean(process.env.ANDROID_HOME && existsSync(process.env.ANDROID_HOME)),
    process.env.ANDROID_HOME ?? "ANDROID_HOME is unset",
  );
  if (process.env.ANDROID_HOME) {
    report(
      "Android SDK path (Windows CMake)",
      !/\s/.test(process.env.ANDROID_HOME),
      "Select a space-free SDK path or junction to preserve clang++ driver mode.",
    );
    const ninja = commandVersion(join(process.env.ANDROID_HOME, "cmake/3.22.1/bin/ninja.exe"), [
      "--version",
    ]);
    report("Ninja (Windows native paths)", ninja.ok && ninja.output === "1.13.2", ninja.output);
  }
  const policy = spawnSync(
    "reg.exe",
    ["query", "HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem", "/v", "LongPathsEnabled"],
    { encoding: "utf8", timeout: 15_000 },
  );
  report(
    "Windows long paths",
    policy.status === 0 && /LongPathsEnabled\s+REG_DWORD\s+0x1\b/i.test(policy.stdout),
    policy.status === 0
      ? "LongPathsEnabled=" +
          (/LongPathsEnabled\s+REG_DWORD\s+(0x[0-9a-f]+)/i.exec(policy.stdout)?.[1] ?? "unknown")
      : "LongPathsEnabled is unavailable",
  );
  console.log(
    "Run verify:android for native compilation/lint; device behavior is a separate gate.",
  );
}
if (role === "ios") {
  report("Mac host", process.platform === "darwin", process.platform);
  inspect("Xcode", "xcodebuild", ["-version"]);
  inspect("CocoaPods", "pod", ["--version"]);
  // T3 discovery does not inherit the project's DEVELOPER_DIR override.
  const systemEnvironment = { ...process.env };
  delete systemEnvironment.DEVELOPER_DIR;
  const simulatorTools = spawnSync("xcrun", ["--find", "simctl"], {
    env: systemEnvironment,
    encoding: "utf8",
    timeout: 15_000,
  });
  report(
    "System simulator tools (T3)",
    simulatorTools.status === 0,
    (
      simulatorTools.stdout ||
      simulatorTools.stderr ||
      simulatorTools.error?.message ||
      "Select full Xcode with xcode-select"
    ).trim(),
  );
  console.log(
    "Prior Mac compatibility is accepted; app build and signing evidence follows in step 6.",
  );
}
console.log("Doctor reports host prerequisites; it does not qualify native builds or devices.");
process.exitCode = failures ? 1 : 0;
