import { Hono } from "hono";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { requireBrowserPublish, requireSession } from "../auth.ts";
import {
  draftRevisionOf,
  getLatestPublishedVersion,
  getPlanBySlug,
  getVersion,
  listPlans,
  listVersions,
  publishDraft,
} from "../plans.ts";
import { dashboardPage } from "../views/dashboard.ts";
import { planFramePage, versionsPage, SUMMARY_COOKIE } from "../views/versions.ts";

type Env = { Variables: { email: string } };

export const planRoutes = new Hono<Env>();

planRoutes.use("*", requireSession);

function serveHtml(c: Context, html: string): Response {
  return c.body(html, 200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "sandbox allow-scripts",
  });
}

const isRaw = (c: Context) => c.req.query("raw") !== undefined;
const summaryOpen = (c: Context) => getCookie(c, SUMMARY_COOKIE) === "1";

// The raw document is framed by this app. The chrome around it is not: with auth
// off, a foreign page can iframe the publish bar and the click is a same-origin POST.
planRoutes.use("*", async (c, next) => {
  await next();
  if (isRaw(c)) return;
  const type = c.res.headers.get("content-type") ?? "";
  if (!type.includes("text/html")) return;
  c.res.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  c.res.headers.set("X-Frame-Options", "DENY");
});

planRoutes.get("/", async (c) => {
  const plans = await listPlans();
  return c.html(dashboardPage(plans, c.get("email")));
});

// The shared durable URL: latest published version. Falls back to the draft
// when nothing has been published yet.
planRoutes.get("/p/:slug", async (c) => {
  const plan = await getPlanBySlug(c.req.param("slug"));
  if (!plan) return c.notFound();

  const latest = await getLatestPublishedVersion(plan.id);
  if (!latest) return c.redirect(`/p/${plan.slug}/draft`);

  if (isRaw(c)) return serveHtml(c, latest.html);
  return c.html(
    planFramePage(
      plan,
      {
        kind: "version",
        version: latest.version,
        latest: latest.version,
        dirty: plan.draft_dirty,
        publishedAt: latest.created_at,
        summary: latest.summary,
      },
      `/p/${plan.slug}?raw=1`,
      summaryOpen(c),
    ),
  );
});

// The working draft: what the token keeps overwriting. Carries the Publish
// button when it has unpublished changes.
planRoutes.get("/p/:slug/draft", async (c) => {
  const plan = await getPlanBySlug(c.req.param("slug"));
  if (!plan || plan.draft_html === null) return c.notFound();

  if (isRaw(c)) return serveHtml(c, plan.draft_html);

  const latest = await getLatestPublishedVersion(plan.id);
  return c.html(
    planFramePage(
      plan,
      {
        kind: "draft",
        dirty: plan.draft_dirty,
        revision: draftRevisionOf(plan),
        latestPublished: latest?.version ?? null,
        updatedAt: plan.draft_updated_at,
        summary: plan.draft_summary,
      },
      `/p/${plan.slug}/draft?raw=1`,
      summaryOpen(c),
    ),
  );
});

// Session-gated with OAuth, otherwise reachable by anyone with network access.
planRoutes.post("/p/:slug/publish", requireBrowserPublish, async (c) => {
  const plan = await getPlanBySlug(c.req.param("slug"));
  if (!plan) return c.notFound();
  const { draft } = await c.req.parseBody();
  const published = await publishDraft(plan.id, c.get("email") || "you", typeof draft === "string" ? draft : "");
  // Unpublished means the draft moved under the user; show them the new one.
  return c.redirect(published ? `/p/${plan.slug}` : `/p/${plan.slug}/draft`);
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

  if (isRaw(c)) return serveHtml(c, version.html);

  const latest = await getLatestPublishedVersion(plan.id);
  const latestNum = latest?.version ?? n;
  return c.html(
    planFramePage(
      plan,
      {
        kind: "version",
        version: n,
        latest: latestNum,
        dirty: plan.draft_dirty,
        publishedAt: version.created_at,
        summary: version.summary,
      },
      `/p/${plan.slug}/v/${n}?raw=1`,
      summaryOpen(c),
    ),
  );
});
