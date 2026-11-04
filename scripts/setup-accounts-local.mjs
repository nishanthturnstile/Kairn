import { randomBytes } from "node:crypto";
import { mkdir, access, writeFile } from "node:fs/promises";
const folder = new URL("../.kairn/accounts/", import.meta.url);
await mkdir(folder, { recursive: true, mode: 0o700 });
const serverPath = new URL("server.json", folder);
const workerPath = new URL("worker.json", folder);
try {
  await access(serverPath);
  await access(workerPath);
  console.log("Existing private account configuration preserved.");
  process.exit(0);
} catch {}
// Refuse a half-created pair rather than silently rotating only one side's keys.
for (const path of [serverPath, workerPath]) {
  try {
    await access(path);
    throw new Error("An incomplete account configuration exists. Reconcile it before setup.");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  }
}
const key = () => randomBytes(32).toString("base64url");
const mailKey = key();
const recipientKey = key();
const storage = {
  endpoint: "http://storage:8333",
  bucket: "kairn-private-avatars",
  accessKey: "kairn-local",
  secretKey: "kairn-storage-local-only",
};
await writeFile(
  serverPath,
  JSON.stringify(
    {
      authDatabaseUrl: "postgresql://kairn_auth:kairn-auth-local@postgres:5432/kairn",
      secret: key(),
      abuseKey: key(),
      trustedProxyCidrs: ["10.245.87.2/32"],
      mail: { keyId: "v1", key: mailKey, recipientKey },
      storage,
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600, flag: "wx" },
);
await writeFile(
  workerPath,
  JSON.stringify(
    {
      storage,
      mail: {
        origin: "https://nishanth-windows.tail30fb6a.ts.net:8444",
        from: "kairn@kairn.invalid",
        host: "mailpit",
        port: 1025,
        secure: false,
        user: "",
        password: "",
        localFixture: true,
        keys: { v1: mailKey },
        recipientKey,
      },
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600, flag: "wx" },
);
console.log("Created private local-only account configuration. Shared recovery remains closed.");
