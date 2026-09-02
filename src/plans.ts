import { sql } from "./db.ts";
import { randomSuffix, slugifyTitle } from "./slug.ts";

export interface Plan {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  draft_html: string | null;
  draft_summary: string | null;
  draft_updated_at: Date | null;
  draft_updated_by: string | null;
  draft_dirty: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PlanVersion {
  id: string;
  plan_id: string;
  version: number;
  title: string | null;
  html: string;
  summary: string | null;
  published_by: string | null;
  created_at: Date;
}

export interface PlanSummary {
  slug: string;
  title: string;
  description: string | null;
  updated_at: Date;
  latest_version: number | null;
  version_count: number;
  draft_dirty: boolean;
}

export interface PushResult {
  slug: string;
  title: string;
  created: boolean;
}

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const [plan] = await sql<Plan[]>`select * from plans where slug = ${slug}`;
  return plan ?? null;
}

export async function listPlans(): Promise<PlanSummary[]> {
  return sql<PlanSummary[]>`
    select
      p.slug,
      p.title,
      p.description,
      p.updated_at,
      p.draft_dirty,
      max(v.version) as latest_version,
      count(v.id)::int as version_count
    from plans p
    left join plan_versions v on v.plan_id = p.id
    group by p.id
    order by p.updated_at desc
  `;
}

export async function getVersion(planId: string, version: number): Promise<PlanVersion | null> {
  const [row] = await sql<PlanVersion[]>`
    select * from plan_versions where plan_id = ${planId} and version = ${version}
  `;
  return row ?? null;
}

export async function getLatestPublishedVersion(planId: string): Promise<PlanVersion | null> {
  const [row] = await sql<PlanVersion[]>`
    select * from plan_versions where plan_id = ${planId} order by version desc limit 1
  `;
  return row ?? null;
}

export async function listVersions(planId: string): Promise<PlanVersion[]> {
  return sql<PlanVersion[]>`
    select id, plan_id, version, title, summary, published_by, created_at, '' as html
    from plan_versions where plan_id = ${planId} order by version desc
  `;
}

async function uniqueSlug(title: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${slugifyTitle(title)}-${randomSuffix()}`;
    if (!(await getPlanBySlug(candidate))) return candidate;
  }
  throw new Error("Could not generate a unique slug");
}

// Token-facing write. Creates the plan on first push (draft only, nothing
// published yet) or overwrites the existing draft. Never touches published
// versions, so an agent cannot mint a milestone.
export async function pushDraft(input: {
  slug?: string;
  title: string;
  description?: string;
  html: string;
  summary?: string;
  updatedBy: string;
}): Promise<PushResult> {
  const summary = input.summary ?? null;
  const description = input.description ?? null;
  const existing = input.slug ? await getPlanBySlug(input.slug) : null;

  if (existing) {
    // coalesce so a push that omits description/summary keeps the prior value
    // rather than wiping the plan's standing description or pending changelog.
    await sql`
      update plans set
        title = ${input.title},
        description = coalesce(${description}, description),
        draft_html = ${input.html},
        draft_summary = coalesce(${summary}, draft_summary),
        draft_updated_at = now(),
        draft_updated_by = ${input.updatedBy},
        draft_dirty = true,
        updated_at = now()
      where id = ${existing.id}
    `;
    return { slug: existing.slug, title: input.title, created: false };
  }

  const slug = input.slug ?? (await uniqueSlug(input.title));
  const [plan] = await sql<Plan[]>`
    insert into plans (slug, title, description, draft_html, draft_summary, draft_updated_at, draft_updated_by, draft_dirty)
    values (${slug}, ${input.title}, ${description}, ${input.html}, ${summary}, now(), ${input.updatedBy}, true)
    returning *
  `;
  if (!plan) throw new Error("Failed to insert plan");
  return { slug: plan.slug, title: plan.title, created: true };
}

// Human-facing action. Snapshots the current draft as the next immutable
// version and marks the draft clean. Returns null when there is nothing to
// publish (no draft) or the draft is already published (not dirty).
export async function publishDraft(
  planId: string,
  publishedBy: string,
): Promise<{ version: number } | null> {
  return sql.begin(async (tx) => {
    const [plan] = await tx<Plan[]>`select * from plans where id = ${planId} for update`;
    if (!plan || plan.draft_html === null || !plan.draft_dirty) return null;

    const [row] = await tx<{ next: number }[]>`
      select coalesce(max(version), 0) + 1 as next from plan_versions where plan_id = ${planId}
    `;
    const next = row?.next ?? 1;
    await tx`
      insert into plan_versions (plan_id, version, title, html, summary, published_by)
      values (${planId}, ${next}, ${plan.title}, ${plan.draft_html}, ${plan.draft_summary}, ${publishedBy})
    `;
    // The draft's pending summary becomes this version's changelog, so clear it.
    await tx`update plans set draft_dirty = false, draft_summary = null, updated_at = now() where id = ${planId}`;
    return { version: next };
  });
}
