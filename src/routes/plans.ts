import { Hono } from "hono";
import type { Context } from "hono";
import { requireSession } from "../auth.ts";
import {
  getLatestPublishedVersion,
  getPlanBySlug,
  getVersion,
  listPlans,
  listVersions,
  publishDraft,
} from "../plans.ts";
import { dashboardPage } from "../views/dashboard.ts";
import { planFramePage, versionsPage } from "../views/versions.ts";

type Env = { Variables: { email: string } };

export const planRoutes = new Hono<Env>();

planRoutes.use("*", requireSession);

function serveHtml(c: Context, html: string) {
  return c.body(html, 200, { "Content-Type": "text/html; charset=utf-8" });
}

const isRaw = (c: Context) => c.req.query("raw") !== undefined;

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
        latestPublished: latest?.version ?? null,
        updatedAt: plan.draft_updated_at,
        summary: plan.draft_summary,
      },
      `/p/${plan.slug}/draft?raw=1`,
    ),
  );
});

// Human-only. Under requireSession, so a token holder with no browser session
// is bounced to login once SSO is on. Snapshots the draft as the next version.
planRoutes.post("/p/:slug/publish", async (c) => {
  const plan = await getPlanBySlug(c.req.param("slug"));
  if (!plan) return c.notFound();
  await publishDraft(plan.id, c.get("email") || "you");
  return c.redirect(`/p/${plan.slug}`);
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
    ),
  );
});
