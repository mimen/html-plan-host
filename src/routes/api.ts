import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { config } from "../config.ts";
import { baseUrl } from "../auth.ts";
import { getLatestPublishedVersion, getPlanBySlug, pushDraft } from "../plans.ts";

export const apiRoutes = new Hono();

function tokenMatches(header: string | undefined): boolean {
  const provided = header?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(config.publishToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Token-authed read so an agent can fetch the last published version as the
// baseline for a cumulative "changes since last publish" summary. Reads are
// otherwise SSO-gated, which the token can't clear; this is the token's window
// into the published baseline (it already holds write access).
apiRoutes.get("/plans/:slug", async (c) => {
  if (!tokenMatches(c.req.header("Authorization"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const plan = await getPlanBySlug(c.req.param("slug"));
  if (!plan) return c.json({ error: "Not found" }, 404);

  const latest = await getLatestPublishedVersion(plan.id);
  return c.json({
    slug: plan.slug,
    title: plan.title,
    latestPublishedVersion: latest?.version ?? null,
    publishedTitle: latest?.title ?? null,
    publishedHtml: latest?.html ?? null,
    draftSummary: plan.draft_summary,
    dirty: plan.draft_dirty,
  });
});

interface PushBody {
  slug?: string;
  title?: string;
  description?: string;
  html?: string;
  summary?: string;
  updatedBy?: string;
}

// The token can only write drafts. Minting a published version is a human,
// session-gated action (POST /p/:slug/publish), never reachable with this token.
apiRoutes.post("/plans", async (c) => {
  if (!tokenMatches(c.req.header("Authorization"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: PushBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const title = body.title?.trim();
  const html = body.html;
  if (!title) return c.json({ error: "title is required" }, 400);
  if (!html || !html.trim()) return c.json({ error: "html is required" }, 400);

  const result = await pushDraft({
    slug: body.slug?.trim() || undefined,
    title,
    description: body.description?.trim() || undefined,
    html,
    summary: body.summary?.trim() || undefined,
    updatedBy: body.updatedBy?.trim() || "cli",
  });

  return c.json(
    {
      ...result,
      draftUrl: `${baseUrl(c)}/p/${result.slug}/draft`,
      shareUrl: `${baseUrl(c)}/p/${result.slug}`,
    },
    result.created ? 201 : 200,
  );
});
