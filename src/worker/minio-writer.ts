import { Client } from "minio";
import { createHash } from "node:crypto";

let minioClient: Client | null = null;

function getClient(): Client | null {
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

function getBucket(): string {
  return process.env.MINIO_BUCKET_PREFIX || "merfy-sites";
}

function fragmentPath(siteId: string, component: string): string {
  return `sites/${siteId}/_islands/${component}.html`;
}

export function hashFragment(html: string): string {
  return createHash("sha256").update(html).digest("hex").slice(0, 8);
}

export async function writeFragment(
  siteId: string,
  component: string,
  html: string,
): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error("MinIO client not available");
  }

  const hash = hashFragment(html);
  const bucket = getBucket();
  const path = fragmentPath(siteId, component);

  const buffer = Buffer.from(html, "utf-8");
  await client.putObject(bucket, path, buffer, buffer.length, {
    "Content-Type": "text/html; charset=utf-8",
    "x-amz-meta-hash": hash,
  });

  return hash;
}
