import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

export const segmentStorageKey = (
  userId: string,
  videoId: string,
  index: number,
) => `${userId}/${videoId}/segments/${index}.webm`;
