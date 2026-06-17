import "dotenv/config";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import mime from "mime-types";

const BUCKET_NAME = "my-bucket-48715616406dg5d1fg2df1hGDhF";

const s3 = new S3Client({
  endpoint: "https://s3.us-east-005.backblazeb2.com",
  region: "us-east-005",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
});

async function uploadFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

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

  const publicUrl = `https://f005.backblazeb2.com/file/${BUCKET_NAME}/${objectKey}`;

  return {
    key: objectKey,
    url: publicUrl,
  };
}

// testing purpose
async function main() {
  try {
    // this path is from relative to web - means think like you are in web folder and then set the path
    const filePath = "./tsconfig.json";

    const result = await uploadFile(filePath);

    console.log("\nUpload Successful");
    console.log("Key:", result.key);
    console.log("URL:", result.url);
  } catch (error) {
    console.error("\nUpload Failed");
    console.error(error);
  }
}
main();
