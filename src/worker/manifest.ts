import { Client } from "minio";

export interface FragmentEntry {
  hash: string;
  updatedAt: string;
}

export interface Manifest {
  version: 1;
  updatedAt: string;
  fragments: Record<string, FragmentEntry>;
}

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
    console.error("Failed to initialize MinIO client for manifest");
    return null;
  }
}

function getBucket(): string {
  return process.env.MINIO_BUCKET_PREFIX || "merfy-sites";
}

function manifestPath(siteId: string): string {
  return `sites/${siteId}/_islands/manifest.json`;
}

function defaultManifest(): Manifest {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    fragments: {},
  };
}

export async function readManifest(siteId: string): Promise<Manifest> {
  const client = getClient();
  if (!client) return defaultManifest();

  const bucket = getBucket();
  const path = manifestPath(siteId);

  try {
    const stream = await client.getObject(bucket, path);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const text = Buffer.concat(chunks).toString("utf-8");
    return JSON.parse(text) as Manifest;
  } catch {
    return defaultManifest();
  }
}

export async function updateManifest(
  siteId: string,
  component: string,
  hash: string,
): Promise<Manifest> {
  const client = getClient();
  if (!client) {
    throw new Error("MinIO client not available");
  }

  const manifest = await readManifest(siteId);

  manifest.fragments[component] = {
    hash,
    updatedAt: new Date().toISOString(),
  };
  manifest.updatedAt = new Date().toISOString();

  const bucket = getBucket();
  const path = manifestPath(siteId);
  const buffer = Buffer.from(JSON.stringify(manifest, null, 2), "utf-8");

  await client.putObject(bucket, path, buffer, buffer.length, {
    "Content-Type": "application/json; charset=utf-8",
  });

  return manifest;
}
