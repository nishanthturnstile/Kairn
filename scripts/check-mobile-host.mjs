import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { SystemStatusSchema } from "@kairn/contracts";

assert.ok(
  process.platform === "win32" || process.platform === "darwin",
  "Run this integration check on the native Windows or Mac host with its Metro server running.",
);
const platform = process.platform === "win32" ? "android" : "ios";
const localEnv = new URL("../apps/mobile/.env.local", import.meta.url);
if (existsSync(localEnv)) process.loadEnvFile(localEnv);
const origin = process.env.EXPO_PUBLIC_API_URL;
assert.ok(origin, "Set EXPO_PUBLIC_API_URL in apps/mobile/.env.local.");

const response = await fetch(new URL("/api/v1/system", origin), {
  signal: AbortSignal.timeout(10_000),
});
assert.ok(response.ok, `API returned HTTP ${response.status}.`);
SystemStatusSchema.parse(await response.json());
console.log("PASS native host can reach the private API and validate the status contract.");

const bundle = await fetch(
  `http://127.0.0.1:8081/apps/mobile/index.bundle?platform=${platform}&dev=true&minify=false`,
  { signal: AbortSignal.timeout(120_000) },
);
assert.ok(bundle.ok, `Metro returned HTTP ${bundle.status}.`);
const bytes = (await bundle.arrayBuffer()).byteLength;
assert.ok(bytes > 0, "Metro returned an empty bundle.");
console.log(`PASS ${platform} development bundle: ${bytes} bytes.`);

await new Promise((resolve, reject) => {
  const socket = new WebSocket("ws://127.0.0.1:8081/hot");
  const timeout = setTimeout(() => {
    socket.close();
    reject(new Error("Metro HMR WebSocket timed out."));
  }, 10_000);
  socket.addEventListener("open", () => {
    clearTimeout(timeout);
    socket.close();
    resolve(undefined);
  });
  socket.addEventListener("error", () => {
    clearTimeout(timeout);
    reject(new Error("Metro HMR WebSocket failed."));
  });
});
console.log(
  "PASS Metro HMR WebSocket; app launch, device API access, and visible Fast Refresh still require device checks.",
);
