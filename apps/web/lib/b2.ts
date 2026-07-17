import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const getB2Config = () => {
  const keyId = process.env.B2_KEY_ID?.trim();
  const applicationKey = process.env.B2_APPLICATION_KEY?.trim();
  const bucket = process.env.B2_BUCKET?.trim();
  const endpoint =
    process.env.B2_ENDPOINT?.trim() || "https://s3.us-east-005.backblazeb2.com";
  const region = process.env.B2_REGION?.trim() || "us-east-005";

  if (!keyId || !applicationKey || !bucket) {
    return null;
  }

  return { keyId, applicationKey, bucket, endpoint, region };
};

export const isB2Configured = () => getB2Config() !== null;

const getS3Client = () => {
  const config = getB2Config();
  if (!config) {
    throw new Error(
      "B2 is not configured. Set B2_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET.",
    );
  }

  return {
    client: new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
    }),
    bucket: config.bucket,
  };
};

/** Short-lived signed GET URL for a B2 object key (playback). */
export const getSignedDownloadUrl = async (
  storageKey: string,
  expiresInSeconds = 3600,
) => {
  const { client, bucket } = getS3Client();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    }),
    { expiresIn: expiresInSeconds },
  );
};

/** Short-lived signed PUT URL (legacy direct-to-B2; prefer putSegmentObject). */
export const getSignedUploadUrl = async (
  storageKey: string,
  contentType = "video/webm",
  expiresInSeconds = 900,
) => {
  const { client, bucket } = getS3Client();

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds },
  );
};

/** Upload segment bytes from the API server (client never talks to B2). */
export const putSegmentObject = async (
  storageKey: string,
  body: Buffer | Uint8Array,
  contentType = "video/webm",
) => {
  const { client, bucket } = getS3Client();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: body,
        ContentType: contentType,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      /block\.sse\.cisco\.com|Cisco Umbrella|Unexpected token|<!DOCTYPE/i.test(
        message,
      )
    ) {
      const err = new Error(
        "Storage upload blocked by network filter (e.g. Cisco Umbrella). The API host must be able to reach Backblaze B2 — use a cloud-hosted API or allowlist *.backblazeb2.com.",
      );
      err.name = "B2NetworkBlockedError";
      throw err;
    }
    throw error;
  }
};

/** Upload JPEG poster image for a video. */
export const putThumbnailObject = async (
  storageKey: string,
  body: Buffer | Uint8Array,
  contentType = "image/jpeg",
) => putSegmentObject(storageKey, body, contentType);

export const segmentStorageKey = (
  userId: string,
  videoId: string,
  index: number,
) => `${userId}/${videoId}/segments/${index}.webm`;

export const thumbnailStorageKey = (userId: string, videoId: string) =>
  `${userId}/${videoId}/thumbnail.jpg`;

export const MAX_SEGMENT_INDEX = 10_000;
export const MAX_SEGMENT_BYTES = 64 * 1024 * 1024;
export const MAX_THUMBNAIL_BYTES = 512 * 1024;
