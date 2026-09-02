import { Hono } from "hono";
import { config } from "./config.ts";
import { initSchema } from "./db.ts";
import { authRoutes } from "./routes/auth.ts";
import { apiRoutes } from "./routes/api.ts";
import { planRoutes } from "./routes/plans.ts";

const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.route("/auth", authRoutes);
app.route("/api", apiRoutes);
// Mounted last: its requireSession middleware gates the dashboard and all
// /p/* read routes.
app.route("/", planRoutes);

await initSchema();

console.log(`html-plan-host listening on :${config.port}`);

export default {
  port: config.port,
  fetch: app.fetch,
};
