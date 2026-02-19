import { getMinioClient, getMinioBucket } from "./minio-client.js";

export interface FragmentEntry {
  hash: string;
  updatedAt: string;
}

export interface Manifest {
  version: 1;
  updatedAt: string;
  fragments: Record<string, FragmentEntry>;
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
  const client = getMinioClient();
  if (!client) return defaultManifest();

  const bucket = getMinioBucket();
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
  const client = getMinioClient();
  if (!client) {
    throw new Error("MinIO client not available");
  }

  const manifest = await readManifest(siteId);

  manifest.fragments[component] = {
    hash,
    updatedAt: new Date().toISOString(),
  };
  manifest.updatedAt = new Date().toISOString();

  const bucket = getMinioBucket();
  const path = manifestPath(siteId);
  const buffer = Buffer.from(JSON.stringify(manifest, null, 2), "utf-8");

  await client.putObject(bucket, path, buffer, buffer.length, {
    "Content-Type": "application/json; charset=utf-8",
  });

  return manifest;
}
