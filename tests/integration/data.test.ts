import { spawn } from "node:child_process";
import { once } from "node:events";
import { createConnection } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { expect, it } from "vite-plus/test";
import { createDatabasePool, readDatabaseUrl } from "@kairn/backend/database";
import { createJobQueue } from "@kairn/backend/queue";
import {
  S3Client,
  CreateBucketCommand,
  DeleteBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}; run pnpm verify:data for the isolated check.`);
  return value;
}
const runId = required("TEST_RUN_ID");
const seed = required("TEST_DATA_PHASE") === "seed";
const queueName = `setup_${runId.replaceAll("-", "")}`;
const bucket = `kairn-setup-${runId}`;
const body = `Persisted foundation fixture ${runId}`;
const connectionString = readDatabaseUrl(required("TEST_DATABASE_URL"));
const ownerString = readDatabaseUrl(required("TEST_MIGRATION_DATABASE_URL"));
const storageEndpoint = required("TEST_STORAGE_ENDPOINT");

it("retains queued work while the consumer is stopped and PostgreSQL is recreated", async () => {
  const owner = createJobQueue(ownerString);
  const producer = createJobQueue(connectionString);
  owner.on("error", () => {});
  producer.on("error", () => {});
  let child: ReturnType<typeof spawn> | undefined;
  async function startConsumer() {
    child = spawn(
      process.execPath,
      [fileURLToPath(new URL("../fixtures/queue-worker.mjs", import.meta.url))],
      {
        env: { ...process.env, TEST_QUEUE: queueName },
        stdio: ["ignore", "inherit", "inherit", "ipc"],
      },
    );
    const message = await Promise.race([
      once(child, "message"),
      once(child, "exit").then(([code]) => {
        throw new Error(`Consumer exited before ready (${code}).`);
      }),
      delay(15_000, undefined, { ref: false }).then(() => {
        throw new Error("Consumer startup timed out.");
      }),
    ]);
    expect(message[0]).toBe("ready");
  }
  async function stopConsumer() {
    if (!child || child.exitCode !== null) return;
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    expect((await exited)[0]).toBe(0);
  }
  try {
    await owner.start();
    await producer.start();
    const pool = createDatabasePool(connectionString, "kairn-permission-check");
    try {
      await expect(
        pool.query("CREATE TABLE pgboss.forbidden_probe (id integer)"),
      ).rejects.toMatchObject({ code: "42501" });
    } finally {
      await pool.end();
    }
    if (seed) {
      await owner.createQueue(queueName, {
        retryLimit: 1,
        expireInSeconds: 30,
        retentionSeconds: 600,
      });
      await startConsumer();
      await stopConsumer();
      expect(await producer.send(queueName, { runId }, { id: runId })).toBe(runId);
      expect((await producer.getJobById(queueName, runId))?.state).toBe("created");
    } else {
      expect((await producer.getJobById(queueName, runId))?.state).toBe("created");
      await startConsumer();
      await expect
        .poll(async () => (await producer.getJobById(queueName, runId))?.state, { timeout: 15_000 })
        .toBe("completed");
      expect((await producer.getJobById(queueName, runId))?.output).toEqual({ runId });
    }
  } finally {
    await stopConsumer();
    if (!seed) await owner.deleteQueue(queueName);
    await producer.stop();
    await owner.stop();
  }
});

it("requires S3 credentials and retains object bytes and metadata after storage recreation", async () => {
  const client = new S3Client({
    endpoint: storageEndpoint,
    region: "us-east-1",
    forcePathStyle: true,
    maxAttempts: 1,
    credentials: {
      accessKeyId: required("TEST_STORAGE_ACCESS_KEY"),
      secretAccessKey: required("TEST_STORAGE_SECRET_KEY"),
    },
  });
  try {
    if (seed) {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: "fixture.txt",
          Body: body,
          ContentType: "text/plain",
          Metadata: { fixture: runId },
        }),
      );
    }
    const anonymous = await fetch(`${storageEndpoint}/${bucket}/fixture.txt`);
    expect(anonymous.status).toBe(403);
    const invalid = new S3Client({
      endpoint: storageEndpoint,
      region: "us-east-1",
      forcePathStyle: true,
      maxAttempts: 1,
      credentials: { accessKeyId: "invalid", secretAccessKey: "invalid" },
    });
    try {
      await expect(
        invalid.send(new GetObjectCommand({ Bucket: bucket, Key: "fixture.txt" })),
      ).rejects.toMatchObject({ $metadata: { httpStatusCode: 403 } });
    } finally {
      invalid.destroy();
    }
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: "fixture.txt" }));
    expect(await result.Body?.transformToString()).toBe(body);
    expect(result.Metadata?.fixture).toBe(runId);
    if (!seed) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: "fixture.txt" }));
      await client.send(new DeleteBucketCommand({ Bucket: bucket }));
    }
  } finally {
    client.destroy();
  }
});

it.runIf(seed)("accepts SMTP into the local Mailpit sink", async () => {
  const socket = createConnection({ host: required("TEST_SMTP_HOST"), port: 1025 });
  const lines: string[] = [];
  socket.setEncoding("utf8");
  socket.setTimeout(5_000, () => socket.destroy(new Error("SMTP timeout")));
  socket.on("data", (chunk: string) => lines.push(chunk));
  try {
    await once(socket, "connect");
    // PIPELINING is supported by the pinned local sink. No outbound provider is involved.
    socket.write(
      `EHLO setup.local\r\nMAIL FROM:<setup@kairn.invalid>\r\nRCPT TO:<sink@kairn.invalid>\r\nDATA\r\nSubject: ${runId}\r\nFrom: setup@kairn.invalid\r\nTo: sink@kairn.invalid\r\n\r\nFoundation sink check.\r\n.\r\nQUIT\r\n`,
    );
    await once(socket, "close");
    expect(lines.join("")).toContain("250");
    const response = await fetch(
      `${required("TEST_MAILPIT_URL")}/api/v1/search?query=${encodeURIComponent(`subject:${runId}`)}`,
    );
    const result = await response.json();
    expect(result.messages).toHaveLength(1);
  } finally {
    socket.destroy();
  }
});
