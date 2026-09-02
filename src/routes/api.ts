import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { config } from "../config.ts";
import { baseUrl } from "../auth.ts";
import { publishPlan } from "../plans.ts";

export const apiRoutes = new Hono();

function tokenMatches(header: string | undefined): boolean {
  const provided = header?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(config.publishToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface PublishBody {
  slug?: string;
  title?: string;
  html?: string;
  publishedBy?: string;
}

apiRoutes.post("/plans", async (c) => {
  if (!tokenMatches(c.req.header("Authorization"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: PublishBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const title = body.title?.trim();
  const html = body.html;
  if (!title) return c.json({ error: "title is required" }, 400);
  if (!html || !html.trim()) return c.json({ error: "html is required" }, 400);

  const slug = body.slug?.trim() || undefined;
  const result = await publishPlan({
    slug,
    title,
    html,
    publishedBy: body.publishedBy?.trim() || "cli",
  });

  return c.json(
    { ...result, url: `${baseUrl(c)}/p/${result.slug}` },
    result.created ? 201 : 200,
  );
});
