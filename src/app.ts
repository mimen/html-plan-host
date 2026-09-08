import { Hono } from "hono";
import { config } from "./config.ts";
import { authRoutes } from "./routes/auth.ts";
import { apiRoutes } from "./routes/api.ts";
import { planRoutes } from "./routes/plans.ts";

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/version", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({ service: "html-plan-host", revision: config.appRevision });
});
app.route("/auth", authRoutes);
app.route("/api", apiRoutes);
// Mounted last so plan session checks do not gate the release probes.
app.route("/", planRoutes);

export default {
  hostname: config.host,
  port: config.port,
  fetch: app.fetch,
};
