import { createServer } from "node:http";
import { z } from "zod";
import { FileRestrictionJournal, signJournalHead, sha256 } from "./journal.js";
import { timingSafeEqual } from "node:crypto";

/** Independent host behind HTTPS. Operator read/fence credentials are distinct from
 * append credentials; fence/resume share the durable append lock with event writes.
 */
export function createJournalService(
  journal: FileRestrictionJournal,
  operatorToken: string,
  keyId: string,
  key: Buffer,
) {
  if (operatorToken.length < 32 || key.length !== 32)
    throw new Error("Invalid journal service credentials.");
  const server = createServer(async (request, response) => {
    response.setHeader("cache-control", "no-store");
    response.setHeader("content-type", "application/json");
    const supplied = Buffer.from(request.headers.authorization ?? "");
    const expected = Buffer.from(`Bearer ${operatorToken}`);
    const operator = supplied.length === expected.length && timingSafeEqual(supplied, expected);
    try {
      if (request.method === "GET" && request.url === "/v1/restrictions") {
        if (!operator) {
          response.writeHead(401).end("{}");
          return;
        }
        const nonce = z.uuid().parse(request.headers["x-journal-nonce"]);
        const entries = await journal.read();
        const body = JSON.stringify({ entries, head: signJournalHead(entries, nonce, keyId, key) });
        if (Buffer.byteLength(body) > 16 * 1024 * 1024) throw new Error();
        response.end(body);
        return;
      }
      if (request.method !== "POST") {
        response.writeHead(405).end("{}");
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of request) {
        const bytes = Buffer.from(chunk);
        size += bytes.length;
        if (size > 8192) throw new Error();
        chunks.push(bytes);
      }
      if (request.url === "/v1/restrictions/fence" || request.url === "/v1/restrictions/resume") {
        if (!operator) {
          response.writeHead(401).end("{}");
          return;
        }
        if (request.url.endsWith("/fence")) await journal.fenceAppender();
        else {
          const payload = z
            .strictObject({ token: z.string().min(32).max(512) })
            .parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
          if (payload.token === operatorToken) throw new Error();
          await journal.resumeAppender(payload.token);
        }
        response.end("{}");
        return;
      }
      if (request.url !== "/v1/restrictions") {
        response.writeHead(404).end("{}");
        return;
      }
      const token = z
        .string()
        .min(32)
        .max(512)
        .parse(request.headers.authorization?.replace(/^Bearer /, ""));
      if (operator) throw new Error();
      const payload = z
        .strictObject({ body: z.string().max(4096), sha256: z.string().regex(/^[a-f0-9]{64}$/) })
        .parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      response.end(
        JSON.stringify(await journal.append(payload.body, payload.sha256, sha256(token))),
      );
    } catch {
      response.writeHead(503).end("{}");
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 5000;
  server.maxConnections = 16;
  return server;
}
