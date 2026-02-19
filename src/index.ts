import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

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

const port = Number(process.env.PORT) || 3200;

console.log(`merfy-islands listening on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
