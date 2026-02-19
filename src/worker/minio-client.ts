import { Client } from "minio";

let minioClient: Client | null = null;

export function getMinioClient(): Client | null {
  if (minioClient) return minioClient;

  const endpoint = process.env.MINIO_ENDPOINT || process.env.S3_ENDPOINT;
  const accessKey =
    process.env.MINIO_ACCESS_KEY || process.env.S3_ACCESS_KEY;
  const secretKey =
    process.env.MINIO_SECRET_KEY || process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKey || !secretKey) return null;

  try {
    const url = new URL(endpoint);
    minioClient = new Client({
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 9000,
      useSSL: url.protocol === "https:",
      accessKey,
      secretKey,
    });
    return minioClient;
  } catch {
    console.error("Failed to initialize MinIO client");
    return null;
  }
}

export function getMinioBucket(): string {
  return process.env.MINIO_BUCKET_PREFIX || "merfy-sites";
}
