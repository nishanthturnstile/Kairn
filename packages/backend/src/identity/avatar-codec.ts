import sharp from "sharp";
sharp.cache(false);
sharp.concurrency(1);
const chunks: Buffer[] = [];
let size = 0;
try {
  for await (const chunk of process.stdin) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > 5242880) throw new Error();
    chunks.push(bytes);
  }
  const input = Buffer.concat(chunks);
  if (
    !input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    !(input[0] === 255 && input[1] === 216 && input[2] === 255)
  )
    throw new Error();
  const image = sharp(input, {
    limitInputPixels: 12000000,
    failOn: "warning",
    sequentialRead: true,
    animated: false,
  });
  const metadata = await image.metadata();
  if (
    !["jpeg", "png"].includes(metadata.format ?? "") ||
    (metadata.pages ?? 1) !== 1 ||
    !metadata.width ||
    !metadata.height ||
    metadata.width * metadata.height > 12000000
  )
    throw new Error();
  const output = await image
    .rotate()
    .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .timeout({ seconds: 5 })
    .toBuffer({ resolveWithObject: true });
  if (output.data.length > 5242880) throw new Error();
  process.stdout.write(
    JSON.stringify({
      bytes: output.data.toString("base64"),
      width: output.info.width,
      height: output.info.height,
      inputWidth: metadata.width,
      inputHeight: metadata.height,
    }),
  );
} catch {
  process.exitCode = 1;
}
