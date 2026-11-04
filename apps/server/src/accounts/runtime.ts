import { readFile, stat } from "node:fs/promises";
import { BlockList, isIP } from "node:net";
import { S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";
import { checkDatabase, createDatabasePool, readDatabaseUrl } from "@kairn/backend/database";
import { startJobProducer } from "@kairn/backend/job-producer";
import { PrivateIdentityStorage } from "@kairn/backend/media";
import { createAccountAuth, createAccountServices } from "./auth.js";

export async function loadAccountRuntime(
  path: string | undefined,
  origin: string,
  pool: ReturnType<typeof createDatabasePool>,
) {
  if (!path) return undefined;
  try {
    return await load(path, origin, pool);
  } catch {
    throw new Error("Account runtime configuration is unavailable or invalid.");
  }
}
async function load(path: string, origin: string, pool: ReturnType<typeof createDatabasePool>) {
  const info = await stat(path);
  if (!info.isFile() || (info.mode & 0o077) !== 0 || info.size > 32768)
    throw new Error("Private file required.");
  const key = z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/)
    .transform((value) => Buffer.from(value, "base64url"));
  const config = z
    .strictObject({
      authDatabaseUrl: z.string(),
      secret: z.string().min(32),
      abuseKey: key,
      trustedProxyCidrs: z.array(z.string()).max(8).default([]),
      mail: z.strictObject({ keyId: z.string().min(1).max(64), key, recipientKey: key }),
      storage: z.strictObject({
        endpoint: z.url(),
        bucket: z.string(),
        accessKey: z.string().min(1),
        secretKey: z.string().min(1),
      }),
    })
    .parse(JSON.parse(await readFile(path, "utf8")));
  const proxies = new BlockList();
  for (const cidr of config.trustedProxyCidrs) {
    const [address, bits] = cidr.split("/");
    if (!address || !bits || !isIP(address)) throw new Error("Invalid proxy network.");
    proxies.addSubnet(address, Number(bits), isIP(address) === 6 ? "ipv6" : "ipv4");
  }
  const authPool = createDatabasePool(readDatabaseUrl(config.authDatabaseUrl), "kairn-auth", 2);
  authPool.on("error", () => {});
  let authProducer: Awaited<ReturnType<typeof startJobProducer>> | undefined;
  let producer: Awaited<ReturnType<typeof startJobProducer>> | undefined;
  const s3 = new S3Client({
    endpoint: config.storage.endpoint,
    region: "us-east-1",
    forcePathStyle: true,
    maxAttempts: 1,
    credentials: {
      accessKeyId: config.storage.accessKey,
      secretAccessKey: config.storage.secretKey,
    },
  });
  try {
    authProducer = await startJobProducer(authPool, () => {});
    producer = await startJobProducer(pool, () => {});
    const auth = createAccountAuth({
      authPool,
      accountPool: pool,
      producer: authProducer,
      origin,
      secret: config.secret,
      abuseKey: config.abuseKey,
      mail: config.mail,
    });
    const services = createAccountServices({
      auth,
      pool,
      producer,
      origin,
      abuseKey: config.abuseKey,
      storage: new PrivateIdentityStorage(s3, config.storage.bucket),
    });
    const ips = new WeakMap<Request, string>();
    return {
      // Only a socket-bound transport can populate this map. A client header
      // becomes an IP only when its socket peer matches configured proxy networks.
      prepare(request: Request, socketAddress: string | undefined) {
        const peer = socketAddress?.replace(/^::ffff:/, "") ?? "";
        let ip = peer;
        if (isIP(peer) && proxies.check(peer, isIP(peer) === 6 ? "ipv6" : "ipv4"))
          ip = request.headers.get("x-kairn-client-ip") ?? "";
        const url = new URL(request.url);
        // Hono's lazy Request inherits native getters without native internal
        // slots (notably duplex). Materialize only supported request fields.
        const canonical = new Request(`${origin}${url.pathname}${url.search}`, {
          method: request.method,
          headers: new Headers([...request.headers]),
          signal: request.signal,
          ...(!["GET", "HEAD"].includes(request.method)
            ? { body: request.body, duplex: "half" }
            : {}),
        });
        if (isIP(ip)) ips.set(canonical, ip);
        return canonical;
      },
      accounts: {
        handleAuth: (request: Request) => auth.handle(request, ips.get(request) ?? ""),
        getMyAccount: auth.getMyAccount,
        handleDomain: (request: Request) =>
          ips.has(request)
            ? services.handle(request)
            : Promise.resolve(
                Response.json(
                  { code: "dependency_unavailable", message: "Account transport is unavailable." },
                  { status: 503 },
                ),
              ),
      },
      checkReady: () => checkDatabase(authPool),
      close: async () => {
        await authProducer?.stop();
        await producer?.stop();
        s3.destroy();
        await authPool.end();
      },
    };
  } catch {
    await authProducer?.stop();
    await producer?.stop();
    s3.destroy();
    await authPool.end();
    throw new Error("Account runtime could not start.");
  }
}
