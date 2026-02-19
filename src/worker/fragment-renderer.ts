import type { StoreAPI } from "../services/store-api.js";
import { rendererRegistry } from "../renderers/registry.js";
import { writeFragment, hashFragment } from "./minio-writer.js";
import { updateManifest } from "./manifest.js";

export interface FragmentResult {
  hash: string;
  html: string;
}

export async function renderAndWriteFragment(
  siteId: string,
  component: string,
  props: Record<string, unknown>,
  api: StoreAPI,
): Promise<FragmentResult> {
  const renderer = rendererRegistry[component];
  if (!renderer) {
    throw new Error(`Unknown component: ${component}`);
  }

  const html = await renderer(props, api);
  const hash = hashFragment(html);

  try {
    await writeFragment(siteId, component, html);
    await updateManifest(siteId, component, hash);
  } catch (err) {
    console.error(
      `MinIO write failed for ${component} (site ${siteId}):`,
      err instanceof Error ? err.message : err,
    );
    // Graceful degradation — return HTML even if MinIO fails
  }

  return { hash, html };
}
