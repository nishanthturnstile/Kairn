import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { release } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const mobile = join(root, "apps/mobile");
const require = createRequire(join(mobile, "package.json"));
const mode = process.argv[2];
const nativeTemplate = "expo-template-bare-minimum@58.0.30";

/** @param {string} command @param {string[]} args @param {{cwd?: string, env?: NodeJS.ProcessEnv}} [options] */
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? mobile,
    env: options.env ?? process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
/** @param {string} name @param {string} executable @param {string[]} args @param {boolean} [ci] */
function bin(name, executable, args, ci = true) {
  const manifestPath = require.resolve(`${name}/package.json`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const relative = typeof manifest.bin === "string" ? manifest.bin : manifest.bin[executable];
  run(process.execPath, [join(dirname(manifestPath), relative), ...args], {
    env: ci ? { ...process.env, CI: "1" } : process.env,
  });
}
function fingerprint() {
  return ["package.json", "pnpm-lock.yaml", "apps/mobile/package.json"].map((name) =>
    createHash("sha256")
      .update(readFileSync(join(root, name)))
      .digest("hex"),
  );
}
function prebuild(platform = "android") {
  const before = fingerprint();
  bin("expo", "expo", [
    "prebuild",
    "--platform",
    platform,
    "--no-install",
    "--template",
    nativeTemplate,
    "--skip-dependency-update",
    "react,react-native",
  ]);
  assert.deepEqual(
    fingerprint(),
    before,
    "Native generation changed package manifests or the lockfile.",
  );
  console.log(`PASS pinned native generation (${nativeTemplate}); dependency inputs unchanged.`);
}

function requireXcode() {
  assert.equal(process.platform, "darwin", "Run iOS native builds in the Mac-local checkout.");
  const xcode = spawnSync("xcodebuild", ["-version"], { encoding: "utf8" });
  assert.ok(
    xcode.status === 0 && xcode.stdout.startsWith("Xcode "),
    "Full Xcode is required. Install it on the Mac and select its Developer directory with DEVELOPER_DIR or xcode-select.",
  );
  console.log(xcode.stdout.trim());
  return xcode.stdout.trim();
}

/** @param {boolean} update */
function installPods(update) {
  const snapshot = join(mobile, "native-locks/ios/Podfile.lock");
  assert.ok(
    update || existsSync(snapshot),
    "Create/review the first native lock with pnpm ios:pods:update on the Mac before building.",
  );
  prebuild("ios");
  const generatedLock = join(mobile, "ios/Podfile.lock");
  if (existsSync(snapshot)) copyFileSync(snapshot, generatedLock);
  run("pod", ["install", ...(update ? [] : ["--deployment"])], { cwd: join(mobile, "ios") });
  if (update) {
    mkdirSync(dirname(snapshot), { recursive: true });
    copyFileSync(generatedLock, snapshot);
    console.log(
      "Updated apps/mobile/native-locks/ios/Podfile.lock; review this native dependency snapshot.",
    );
  } else {
    assert.deepEqual(
      readFileSync(generatedLock),
      readFileSync(snapshot),
      "CocoaPods changed the native lock.",
    );
  }
}

if (mode === "check") {
  bin("typescript", "tsc", ["--noEmit"]);
  bin("expo", "expo", ["install", "--check"]);
  bin("expo-doctor", "expo-doctor", []);
} else if (mode === "export") {
  for (const platform of ["android", "ios"])
    bin("expo", "expo", ["export", "--platform", platform, "--output-dir", `export-${platform}`]);
} else if (mode === "start") {
  bin("expo", "expo", ["start", "--dev-client", ...process.argv.slice(3)], false);
} else if (mode === "dev-android" || mode === "dev-ios") {
  const platform = mode === "dev-android" ? "android" : "ios";
  const args = process.argv.slice(3);
  if (!args.includes("--help")) {
    // These are developer-invoked local commands. Agent UI acceptance uses device_open's CLI.
    assert.equal(
      process.platform,
      platform === "android" ? "win32" : "darwin",
      `Run ${mode} in the ${platform === "android" ? "Windows" : "Mac"}-local checkout.`,
    );
    if (platform === "android") {
      run(process.execPath, [fileURLToPath(import.meta.url), "android"]);
    } else {
      requireXcode();
      installPods(false);
    }
  }
  bin(
    "expo",
    "expo",
    [
      `run:${platform}`,
      ...(args.includes("--help") ? [] : ["--no-install"]),
      ...(platform === "android" && !args.includes("--help")
        ? ["--binary", join(mobile, "android/app/build/outputs/apk/debug/app-debug.apk")]
        : []),
      ...args,
    ],
    false,
  );
} else if (mode === "prebuild-android") {
  prebuild();
} else if (mode === "prebuild-ios") {
  assert.equal(process.platform, "darwin", "Generate iOS in the Mac-local checkout.");
  prebuild("ios");
} else if (["ios-pods-update", "ios-simulator", "verify-ios"].includes(mode ?? "")) {
  const xcode = requireXcode();
  installPods(mode === "ios-pods-update");
  if (mode !== "ios-pods-update") {
    const projects = readdirSync(join(mobile, "ios")).filter((name) =>
      name.endsWith(".xcworkspace"),
    );
    assert.equal(projects.length, 1, "Expected one generated application workspace.");
    const workspace = projects[0];
    assert.ok(workspace);
    run(
      "xcodebuild",
      [
        "-workspace",
        workspace,
        "-scheme",
        workspace.slice(0, -".xcworkspace".length),
        "-configuration",
        "Debug",
        "-sdk",
        "iphonesimulator",
        "-destination",
        "generic/platform=iOS Simulator",
        "-derivedDataPath",
        join(root, ".kairn/ios-build"),
        "-jobs",
        "2",
        `ARCHS=${process.arch === "arm64" ? "arm64" : "x86_64"}`,
        "ONLY_ACTIVE_ARCH=YES",
        // SecureStore needs Xcode's simulated app-identifier entitlement.
        // The local identity requires no team certificate or provisioning profile.
        "CODE_SIGNING_ALLOWED=YES",
        "CODE_SIGN_IDENTITY=-",
        "build",
      ],
      { cwd: join(mobile, "ios") },
    );
    run("codesign", [
      "--verify",
      "--deep",
      "--strict",
      join(
        root,
        ".kairn/ios-build/Build/Products/Debug-iphonesimulator",
        `${workspace.slice(0, -".xcworkspace".length)}.app`,
      ),
    ]);
    if (mode === "verify-ios") {
      /** @param {string} command @param {string[]} args */
      const output = (command, args) => {
        const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
        return result.status === 0 ? result.stdout.trim() : "unavailable";
      };
      const inputs = Object.fromEntries(
        [
          "package.json",
          "pnpm-lock.yaml",
          "apps/mobile/package.json",
          "apps/mobile/app.json",
          "apps/mobile/babel.config.cjs",
          "apps/mobile/native-locks/ios/Podfile.lock",
        ].map((path) => [
          path,
          createHash("sha256")
            .update(readFileSync(join(root, path)))
            .digest("hex"),
        ]),
      );
      const evidence = join(root, ".kairn/verification");
      mkdirSync(evidence, { recursive: true });
      writeFileSync(
        join(evidence, "ios-build.json"),
        `${JSON.stringify(
          {
            recordedAt: new Date().toISOString(),
            commit: output("git", ["rev-parse", "HEAD"]),
            worktree: output("git", ["status", "--short"]),
            xcode,
            macos: output("sw_vers", ["-productVersion"]),
            cocoapods: output("pod", ["--version"]),
            architecture: process.arch,
            nativeTemplate,
            inputs,
            simulatorBuild: "passed",
            simulatorSigning: "local identity; strict signature verification passed",
            simulatorRuntime: "not_run",
            physicalDevices: "not_run",
          },
          null,
          2,
        )}\n`,
      );
      console.log(
        "PASS iOS simulator compilation; build evidence: .kairn/verification/ios-build.json.",
      );
      console.log(
        "Simulator launch/API/reload/style and Personal Team iPhone/iPad acceptance remain separate device checks.",
      );
    }
  }
} else if (mode === "android" || mode === "verify-android") {
  if (process.platform === "linux" && /microsoft/i.test(release()))
    throw new Error("Run Android native builds in the Windows-local checkout; WSL owns Compose.");
  const java = spawnSync("java", ["-version"], { encoding: "utf8" });
  assert.match(
    java.stderr || java.stdout,
    /version "17[."]/,
    "Select JDK 17 before building Android.",
  );
  const sdk = process.env.ANDROID_HOME;
  assert.ok(sdk && existsSync(sdk), "ANDROID_HOME must point to this host's Android SDK.");
  if (process.platform === "win32") {
    assert.doesNotMatch(
      sdk,
      /\s/,
      "Select a space-free Android SDK path or junction; Windows CMake short names lose clang++ driver mode.",
    );
    const policy = spawnSync(
      "reg.exe",
      ["query", "HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem", "/v", "LongPathsEnabled"],
      { encoding: "utf8" },
    );
    assert.ok(
      policy.status === 0 && /LongPathsEnabled\s+REG_DWORD\s+0x1\b/i.test(policy.stdout),
      "Enable Windows long paths before building; see docs/implementation/native_host_setup.md.",
    );
    const ninja = spawnSync(join(sdk, "cmake/3.22.1/bin/ninja.exe"), ["--version"], {
      encoding: "utf8",
    });
    assert.equal(
      ninja.status === 0 ? ninja.stdout.trim() : "unavailable",
      "1.13.2",
      "Windows native paths require the qualified Ninja 1.13.2; see docs/implementation/native_host_setup.md.",
    );
  }
  prebuild();
  const architectures = process.env.KAIRN_ANDROID_ARCHITECTURES;
  if (architectures)
    assert.ok(
      architectures
        .split(",")
        .every((value) => ["arm64-v8a", "armeabi-v7a", "x86", "x86_64"].includes(value)),
      "Unsupported Android architecture.",
    );
  const args = [
    "--no-daemon",
    "--max-workers=2",
    ...(architectures ? [`-PreactNativeArchitectures=${architectures}`] : []),
    ":app:assembleDebug",
    ...(mode === "verify-android" ? [":app:lintDebug"] : []),
  ];
  const cwd = join(mobile, "android");
  if (process.platform === "win32") {
    // Fixed command/validated architecture values; paths stay in cwd, outside shell text.
    run(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `.\\gradlew.bat ${args.join(" ")}`], {
      cwd,
    });
  } else run("./gradlew", args, { cwd });
} else {
  throw new Error(
    "Usage: mobile.mjs check|export|start|dev-android|dev-ios|prebuild-android|android|verify-android|prebuild-ios|ios-pods-update|ios-simulator|verify-ios",
  );
}
