import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { config } from "../config.ts";
import { baseUrl } from "../auth.ts";
import { pushDraft } from "../plans.ts";

export const apiRoutes = new Hono();

function tokenMatches(header: string | undefined): boolean {
  const provided = header?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(config.publishToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface PushBody {
  slug?: string;
  title?: string;
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
