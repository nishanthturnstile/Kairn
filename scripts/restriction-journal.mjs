import { readFile, stat } from "node:fs/promises";
import { FileRestrictionJournal } from "@kairn/backend/journal";
import { createJournalService } from "@kairn/backend/journal-server";
// Independent Linux host only, bound to loopback behind its HTTPS reverse proxy.
const [action, path] = process.argv.slice(2);
try {
  if (!path || !["initialize", "serve"].includes(action ?? "")) throw new Error();
  const info = await stat(path);
  if (!info.isFile() || (info.mode & 0o077) !== 0 || info.size > 32768) throw new Error();
  const config = JSON.parse(await readFile(path, "utf8"));
  if (
    typeof config.directory !== "string" ||
    !config.directory.startsWith("/") ||
    typeof config.operatorToken !== "string" ||
    !/^[A-Za-z0-9.:-]{1,64}$/.test(config.keyId) ||
    !Number.isInteger(config.port) ||
    config.port < 1024 ||
    config.port > 65535
  )
    throw new Error();
  const keys = new Map(
    Object.entries(config.signingSeeds).map(([id, value]) => [
      id,
      Buffer.from(String(value), "base64url"),
    ]),
  );
  const key = keys.get(config.keyId);
  if (!key || key.length !== 32 || keys.size < 1) throw new Error();
  const journal = new FileRestrictionJournal(config.directory, config.keyId, keys);
  if (action === "initialize") {
    if (config.operatorToken === config.initialAppenderToken) throw new Error();
    await journal.initializeAppender(config.initialAppenderToken);
    console.log(
      "Independent journal initialized; remove the initial appender token from this configuration.",
    );
  } else {
    await stat(`${config.directory}/appender.json`);
    await stat(`${config.directory}/journal-head.json`);
    await journal.read();
    const server = createJournalService(journal, config.operatorToken, config.keyId, key);
    server.listen(config.port, "127.0.0.1", () =>
      console.log("Independent journal listening on loopback."),
    );
    for (const signal of ["SIGTERM", "SIGINT"])
      process.once(signal, () => server.close(() => process.exit(0)));
  }
} catch {
  console.error(
    "Independent journal startup failed; retain the append fence and private evidence.",
  );
  process.exitCode = 1;
}
