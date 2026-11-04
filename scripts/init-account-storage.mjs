import { readFile } from "node:fs/promises";
import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
const config = JSON.parse(await readFile("/run/kairn/account-worker.json", "utf8"));
const client = new S3Client({
  endpoint: config.storage.endpoint,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: config.storage.accessKey, secretAccessKey: config.storage.secretKey },
});
try {
  await client.send(new CreateBucketCommand({ Bucket: config.storage.bucket }));
  console.log("Private avatar bucket is ready.");
} finally {
  client.destroy();
}
