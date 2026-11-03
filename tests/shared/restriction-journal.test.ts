import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:https";
import { getCACertificates, setDefaultCACertificates } from "node:tls";
import { it, expect } from "vite-plus/test";
import {
  FileRestrictionJournal,
  HttpRestrictionJournal,
  sha256,
  journalPublicKeys,
  verifyJournal,
} from "@kairn/backend/journal";
import { createJournalService } from "@kairn/backend/journal-server";
function body() {
  const id = randomUUID();
  return JSON.stringify({
    id,
    kind: "journey.archive",
    resourceKind: "journey",
    resourceId: randomUUID(),
    accountId: null,
    journeyId: randomUUID(),
    membershipId: null,
    sourceId: null,
    sourceGrantId: null,
    exportGrantId: null,
    invitationId: null,
    transferId: null,
    generation: 2,
  });
}
it("fsyncs idempotent restrictions and detects a missing or damaged acknowledged tail", async () => {
  const directory = await mkdtemp(join(tmpdir(), "journal-durability-"));
  const journal = new FileRestrictionJournal(directory, "v1", new Map([["v1", randomBytes(32)]]));
  try {
    const value = body();
    const first = await journal.append(value, sha256(value));
    expect(await journal.append(value, sha256(value))).toEqual(first);
    const log = join(directory, "restrictions.ndjson");
    const original = await readFile(log, "utf8");
    await writeFile(log, original.slice(0, -1));
    await expect(journal.read()).rejects.toThrow("incomplete");
    await writeFile(log, "");
    await expect(journal.read()).rejects.toThrow("incomplete");
    await rm(log);
    await expect(journal.read()).rejects.toThrow("missing");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
it("uses real HTTPS, a fresh signed head, independent operator privilege and a durable old-appender fence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "journal-http-"));
  const keys = new Map([["v1", randomBytes(32)]]);
  const journal = new FileRestrictionJournal(directory, "v1", keys);
  const operatorToken = randomBytes(32).toString("base64url");
  const oldToken = randomBytes(32).toString("base64url");
  const newToken = randomBytes(32).toString("base64url");
  const certificate = await readFile(
    new URL("../fixtures/identity/journal-test-cert.pem", import.meta.url),
    "utf8",
  );
  const privateKey = await readFile(
    new URL("../fixtures/identity/journal-test-key.pem", import.meta.url),
  );
  // Public test-only certificate/key. Trust is scoped to this isolated test process.
  const authorities = getCACertificates("default");
  setDefaultCACertificates([...authorities, certificate]);
  const service = createJournalService(journal, operatorToken, "v1", keys.get("v1")!);
  const server = createServer({ key: privateKey, cert: certificate }, (request, response) => {
    service.emit("request", request, response);
  });
  try {
    await journal.initializeAppender(oldToken);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error();
    const endpoint = new URL(`https://localhost:${address.port}/v1/restrictions`);
    const appender = new HttpRestrictionJournal(endpoint, oldToken, journalPublicKeys(keys));
    const operator = new HttpRestrictionJournal(endpoint, operatorToken, journalPublicKeys(keys));
    const value = body();
    await appender.append(value, sha256(value));
    const verified = await operator.read();
    expect(verified.length).toBe(1);
    expect(() => verifyJournal(verified, keys)).toThrow();
    await expect(appender.read()).rejects.toThrow();
    await expect(appender.fence()).rejects.toThrow();
    await operator.fence();
    await expect(appender.append(body(), sha256("wrong"))).rejects.toThrow();
    const afterFence = body();
    await expect(appender.append(afterFence, sha256(afterFence))).rejects.toThrow();
    await operator.resume(newToken);
    await expect(appender.append(afterFence, sha256(afterFence))).rejects.toThrow();
    await new HttpRestrictionJournal(endpoint, newToken, journalPublicKeys(keys)).append(
      afterFence,
      sha256(afterFence),
    );
    expect((await operator.read()).length).toBe(2);
    await operator.fence();
    await expect(operator.resume(oldToken)).rejects.toThrow();
    const restarted = new FileRestrictionJournal(directory, "v1", keys);
    const afterRestart = body();
    await expect(
      restarted.append(afterRestart, sha256(afterRestart), sha256(newToken)),
    ).rejects.toThrow("fenced");
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    service.close();
    setDefaultCACertificates(authorities);
    await rm(directory, { recursive: true, force: true });
  }
});
