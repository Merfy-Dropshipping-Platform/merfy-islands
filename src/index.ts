import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { rendererRegistry } from "./renderers/registry.js";
import { StoreAPI } from "./services/store-api.js";

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
