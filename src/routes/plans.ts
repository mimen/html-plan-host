import { Hono } from "hono";
import type { Context } from "hono";
import { requireSession } from "../auth.ts";
import {
  getLatestVersion,
  getPlanBySlug,
  getVersion,
  listPlans,
  listVersions,
} from "../plans.ts";
import { dashboardPage } from "../views/dashboard.ts";
import { planFramePage, versionsPage } from "../views/versions.ts";

type Env = { Variables: { email: string } };

export const planRoutes = new Hono<Env>();

planRoutes.use("*", requireSession);

planRoutes.get("/", async (c) => {
  const plans = await listPlans();
  return c.html(dashboardPage(plans, c.get("email")));
});

function serveHtml(c: Context, html: string) {
  return c.body(html, 200, { "Content-Type": "text/html; charset=utf-8" });
}

planRoutes.get("/p/:slug", async (c) => {
  const plan = await getPlanBySlug(c.req.param("slug"));
  if (!plan) return c.notFound();
  const latest = await getLatestVersion(plan.id);
  if (!latest) return c.notFound();
  if (c.req.query("raw") !== undefined) return serveHtml(c, latest.html);
  return c.html(planFramePage(plan, latest.version, latest.version, `/p/${plan.slug}?raw=1`));
});

planRoutes.get("/p/:slug/versions", async (c) => {
  const plan = await getPlanBySlug(c.req.param("slug"));
  if (!plan) return c.notFound();
  const versions = await listVersions(plan.id);
  return c.html(versionsPage(plan, versions));
});

planRoutes.get("/p/:slug/v/:n", async (c) => {
  const plan = await getPlanBySlug(c.req.param("slug"));
  if (!plan) return c.notFound();

  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1) return c.notFound();

  const version = await getVersion(plan.id, n);
  if (!version) return c.notFound();

  const latest = await getLatestVersion(plan.id);
  const latestNum = latest?.version ?? n;

  // ?raw=1 is what the wrapper's iframe loads: the stored HTML, untouched.
  if (c.req.query("raw") !== undefined) return serveHtml(c, version.html);

  return c.html(planFramePage(plan, n, latestNum, `/p/${plan.slug}/v/${n}?raw=1`));
});
