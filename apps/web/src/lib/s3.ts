import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? "http://localhost:8080",
  region: process.env.S3_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "local",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "local",
  },
  forcePathStyle: true,
});

export type S3Bucket = "avatars" | "activities" | "galleries";

function getBucketName(bucket: S3Bucket): string {
  const map: Record<S3Bucket, string> = {
    avatars: process.env.S3_BUCKET_AVATARS ?? "summermate-avatars",
    activities: process.env.S3_BUCKET_ACTIVITIES ?? "summermate-activities",
    galleries: process.env.S3_BUCKET_GALLERIES ?? "summermate-galleries",
  };
  return map[bucket];
}

function getPublicUrl(bucket: S3Bucket, key: string): string {
  const base = process.env.S3_PUBLIC_URL ?? "http://localhost:8080";
  return `${base}/${getBucketName(bucket)}/${key}`;
}

export async function uploadFile(
  bucket: S3Bucket,
  file: Buffer,
  mimeType: string,
  folder?: string
): Promise<{ key: string; url: string }> {
  const ext = mimeType.split("/")[1] ?? "bin";
  const key = folder
    ? `${folder}/${randomUUID()}.${ext}`
    : `${randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: getBucketName(bucket),
      Key: key,
      Body: file,
      ContentType: mimeType,
    })
  );

  return { key, url: getPublicUrl(bucket, key) };
}

export async function deleteFile(bucket: S3Bucket, key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: getBucketName(bucket),
      Key: key,
    })
  );
}

export async function getPresignedUploadUrl(
  bucket: S3Bucket,
  key: string,
  mimeType: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(bucket),
    Key: key,
    ContentType: mimeType,
  });

  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function getPresignedDownloadUrl(
  bucket: S3Bucket,
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(bucket),
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export { getPublicUrl };
