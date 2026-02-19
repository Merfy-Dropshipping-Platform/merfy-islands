import { createHash } from "node:crypto";
import { getMinioClient, getMinioBucket } from "./minio-client.js";

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
  const client = getMinioClient();
  if (!client) {
    throw new Error("MinIO client not available");
  }

  const hash = hashFragment(html);
  const bucket = getMinioBucket();
  const path = fragmentPath(siteId, component);

  const buffer = Buffer.from(html, "utf-8");
  await client.putObject(bucket, path, buffer, buffer.length, {
    "Content-Type": "text/html; charset=utf-8",
    "x-amz-meta-hash": hash,
  });

  return hash;
}
