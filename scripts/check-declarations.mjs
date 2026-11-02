import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const owners = [
  { directory: root, version: "7.0.2" },
  { directory: join(root, "apps/mobile"), version: "6.0.3" },
];
for (const owner of owners) {
  const require = createRequire(join(owner.directory, "package.json"));
  const compiler = require("typescript/package.json");
  assert.equal(compiler.version, owner.version);
  const directory = await mkdtemp(join(owner.directory, ".toolchain-probe-"));
  try {
    const pure = await readFile(join(root, "tests/types/pure.ts"), "utf8");
    await writeFile(join(directory, "consumer.ts"), pure);
    const config = {
      extends: join(root, "tsconfig.base.json"),
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        lib: ["ES2023"],
        types: [],
      },
      files: ["consumer.ts"],
    };
    const configPath = join(directory, "tsconfig.json");
    const compilerPath = join(require.resolve("typescript/package.json"), "..", compiler.bin.tsc);
    await writeFile(configPath, JSON.stringify(config));
    execFileSync(process.execPath, [compilerPath, "--project", configPath], { stdio: "inherit" });
    const universal = await readFile(join(root, "tests/types/universal.ts"), "utf8");
    await writeFile(join(directory, "consumer.ts"), universal);
    const client = await readFile(join(root, "tests/types/client.ts"), "utf8");
    if (owner.version === "6.0.3") {
      // Real Expo/RN globals, without DOM or Node ambient libraries.
      await writeFile(join(directory, "client.ts"), `import "react-native";\n${client}`);
      await writeFile(
        configPath,
        JSON.stringify({
          extends: join(owner.directory, "tsconfig.json"),
          compilerOptions: { lib: ["ES2023"], types: ["react"] },
          files: ["consumer.ts", "client.ts"],
          include: [],
        }),
      );
    } else {
      await writeFile(join(directory, "client.ts"), client);
      config.files = ["consumer.ts", "client.ts"];
      config.compilerOptions.lib = ["ES2023", "DOM", "DOM.Iterable"];
      await writeFile(configPath, JSON.stringify(config));
    }
    execFileSync(process.execPath, [compilerPath, "--project", configPath], { stdio: "inherit" });
    console.log(
      `PASS TS${owner.version}: pure packages without ambient leakage, compiled contracts/protocol/client in platform globals, and negative type fixtures.`,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
