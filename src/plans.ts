import { sql } from "./db.ts";
import { randomSuffix, slugifyTitle } from "./slug.ts";

export interface Plan {
  id: string;
  slug: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlanVersion {
  id: string;
  plan_id: string;
  version: number;
  html: string;
  published_by: string | null;
  created_at: Date;
}

export interface PlanSummary {
  slug: string;
  title: string;
  updated_at: Date;
  latest_version: number;
  version_count: number;
}

export interface PublishResult {
  slug: string;
  title: string;
  version: number;
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
      p.updated_at,
      coalesce(max(v.version), 0) as latest_version,
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

export async function getLatestVersion(planId: string): Promise<PlanVersion | null> {
  const [row] = await sql<PlanVersion[]>`
    select * from plan_versions where plan_id = ${planId} order by version desc limit 1
  `;
  return row ?? null;
}

export async function listVersions(planId: string): Promise<PlanVersion[]> {
  return sql<PlanVersion[]>`
    select id, plan_id, version, published_by, created_at, '' as html
    from plan_versions where plan_id = ${planId} order by version desc
  `;
}

// Generate a unique slug from a title. Retries with a fresh suffix on the
// (astronomically unlikely) collision.
async function uniqueSlug(title: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${slugifyTitle(title)}-${randomSuffix()}`;
    const existing = await getPlanBySlug(candidate);
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique slug");
}

// Publish a plan. With no slug (or an unknown one) this creates a new plan at a
// fresh durable URL; with a known slug it appends a new version at the same URL.
export async function publishPlan(input: {
  slug?: string;
  title: string;
  html: string;
  publishedBy: string;
}): Promise<PublishResult> {
  return sql.begin(async (tx) => {
    const existing = input.slug
      ? (await tx<Plan[]>`select * from plans where slug = ${input.slug}`)[0] ?? null
      : null;

    if (existing) {
      const [row] = await tx<{ next: number }[]>`
        select coalesce(max(version), 0) + 1 as next
        from plan_versions where plan_id = ${existing.id}
      `;
      const next = row?.next ?? 1;
      await tx`
        insert into plan_versions (plan_id, version, html, published_by)
        values (${existing.id}, ${next}, ${input.html}, ${input.publishedBy})
      `;
      await tx`update plans set title = ${input.title}, updated_at = now() where id = ${existing.id}`;
      return { slug: existing.slug, title: input.title, version: next, created: false };
    }

    const slug = input.slug ?? (await uniqueSlug(input.title));
    const [plan] = await tx<Plan[]>`
      insert into plans (slug, title) values (${slug}, ${input.title}) returning *
    `;
    if (!plan) throw new Error("Failed to insert plan");
    await tx`
      insert into plan_versions (plan_id, version, html, published_by)
      values (${plan.id}, 1, ${input.html}, ${input.publishedBy})
    `;
    return { slug: plan.slug, title: plan.title, version: 1, created: true };
  });
}
