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
import { oldVersionBanner, versionsPage } from "../views/versions.ts";

type Env = { Variables: { email: string } };

export const planRoutes = new Hono<Env>();

planRoutes.use("*", requireSession);

planRoutes.get("/", async (c) => {
  const plans = await listPlans();
  return c.html(dashboardPage(plans, c.get("email")));
});

// Inject the "old version" banner right after <body>, falling back to prepend
// if the document has no body tag.
function withBanner(html: string, banner: string): string {
  const match = html.match(/<body[^>]*>/i);
  if (match) {
    const idx = (match.index ?? 0) + match[0].length;
    return html.slice(0, idx) + banner + html.slice(idx);
  }
  return banner + html;
}

function serveHtml(c: Context, html: string) {
  return c.body(html, 200, { "Content-Type": "text/html; charset=utf-8" });
}

planRoutes.get("/p/:slug", async (c) => {
  const plan = await getPlanBySlug(c.req.param("slug"));
  if (!plan) return c.notFound();
  const latest = await getLatestVersion(plan.id);
  if (!latest) return c.notFound();
  return serveHtml(c, latest.html);
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
  const html = n < latestNum ? withBanner(version.html, oldVersionBanner(plan, n, latestNum)) : version.html;
  return serveHtml(c, html);
});
