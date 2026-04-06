import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { rendererRegistry } from "./renderers/registry.js";
import { StoreAPI } from "./services/store-api.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

// Cache islands.js content at startup
let islandsJsCache: string | null = null;
try {
  islandsJsCache = readFileSync(join(publicDir, "islands.js"), "utf-8");
} catch {
  console.warn("public/islands.js not found — GET /islands.js will return 404");
}

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (origin.endsWith(".merfy.ru")) return origin;
      if (origin === "https://merfy.ru") return origin;
      return null;
    },
  }),
);

app.get("/health", (c) => {
  return c.text("ok");
});

app.get("/islands.js", (c) => {
  if (!islandsJsCache) {
    return c.text("// islands.js not found", 404);
  }
  c.header("Content-Type", "application/javascript; charset=utf-8");
  c.header("Cache-Control", "public, max-age=3600");
  return c.body(islandsJsCache);
});

app.post("/islands/batch", async (c) => {
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const { storeId, components } = body;

    if (!storeId || typeof storeId !== "string") {
      return c.json({ error: "storeId is required" }, 400);
    }
    if (!Array.isArray(components) || components.length === 0) {
      return c.json({ error: "components array is required" }, 400);
    }

    const storeApiUrl = process.env.STORE_API_URL || "https://gateway.merfy.ru/api";
    const api = new StoreAPI(storeApiUrl, storeId);

    const results = await Promise.allSettled(
      components.map(async (name: string) => {
        const renderer = rendererRegistry[name];
        if (!renderer) return null;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout rendering ${name}`)), 10000),
        );
        return Promise.race([renderer({}, api), timeoutPromise]);
      }),
    );

    const response: Record<string, string | null> = {};
    components.forEach((name: string, i: number) => {
      const result = results[i];
      response[name] =
        result.status === "fulfilled" ? result.value ?? null : null;
    });

    return c.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Batch render error:", err);
    return c.json({ error: message }, 500);
  }
});

app.post("/islands/:component", async (c) => {
  const component = c.req.param("component");

  const renderer = rendererRegistry[component];
  if (!renderer) {
    return c.json({ error: `Unknown component: ${component}` }, 404);
  }

  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const { storeId, ...props } = body;

    if (!storeId || typeof storeId !== "string") {
      return c.json({ error: "storeId is required" }, 400);
    }

    const storeApiUrl = process.env.STORE_API_URL || "https://gateway.merfy.ru/api";
    const api = new StoreAPI(storeApiUrl, storeId);

    const html = await renderer(props, api);
    return c.html(html);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error(`Render error for ${component}:`, err);
    return c.json({ error: message }, 500);
  }
});

const port = Number(process.env.PORT) || 3200;

console.log(`merfy-islands listening on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
