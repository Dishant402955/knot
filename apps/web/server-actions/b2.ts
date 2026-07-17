/**
 * Legacy B2 upload smoke-test script.
 * Prefer importing from `@/lib/b2` for product code (signed downloads).
 *
 * Run manually with: pnpm exec tsx server-actions/b2.ts
 */
import "dotenv/config";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import mime from "mime-types";

const BUCKET_NAME = process.env.B2_BUCKET;

async function uploadFile(filePath: string) {
  if (!BUCKET_NAME) {
    throw new Error("B2_BUCKET is not set");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  const s3 = new S3Client({
    endpoint:
      process.env.B2_ENDPOINT || "https://s3.us-east-005.backblazeb2.com",
    region: process.env.B2_REGION || "us-east-005",
    credentials: {
      accessKeyId: process.env.B2_KEY_ID!,
      secretAccessKey: process.env.B2_APPLICATION_KEY!,
    },
  });

  const fileName = path.basename(filePath);
  const objectKey = `uploads/${Date.now()}-${fileName}`;
  const fileStream = fs.createReadStream(filePath);
  const contentType = mime.lookup(filePath) || "application/octet-stream";

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      Body: fileStream,
      ContentType: contentType,
    }),
  );

  return { key: objectKey };
}

async function main() {
  if (!process.argv.includes("--run")) {
    console.log("Pass --run to execute the B2 upload smoke test.");
    return;
  }

  try {
    const filePath = "./tsconfig.json";
    const result = await uploadFile(filePath);
    console.log("Upload Successful", result);
  } catch (error) {
    console.error("Upload Failed", error);
  }
}

void main();
