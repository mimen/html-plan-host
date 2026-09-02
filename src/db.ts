import postgres from "postgres";
import { config } from "./config.ts";

// Heroku Postgres presents a self-signed cert, so we relax verification in
// production. Locally (plain postgres:// on localhost) SSL is disabled.
const useSsl = config.isProduction || /sslmode=require/.test(config.databaseUrl);

export const sql = postgres(config.databaseUrl, {
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  onnotice: () => {},
});

// Idempotent schema creation. Cheap enough to run on every boot and keeps the
// service self-contained (no migration tooling for a single-user app).
//
// Model: a plan owns one mutable draft (columns on `plans`, written by the
// token) plus a stack of immutable published versions (`plan_versions`, minted
// only by a human publish). draft_dirty tracks whether the draft has changes
// not yet published.
export async function initSchema(): Promise<void> {
  await sql`
    create table if not exists plans (
      id uuid primary key default gen_random_uuid(),
      slug text unique not null,
      title text not null,
      draft_html text,
      draft_summary text,
      draft_updated_at timestamptz,
      draft_updated_by text,
      draft_dirty boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists plan_versions (
      id uuid primary key default gen_random_uuid(),
      plan_id uuid not null references plans(id) on delete cascade,
      version integer not null,
      title text,
      html text not null,
      summary text,
      published_by text,
      created_at timestamptz not null default now(),
      unique (plan_id, version)
    )
  `;

  // Migrate databases created before the draft/published split. Adding columns
  // and backfilling are both guarded, so this is safe to re-run every boot.
  await sql`alter table plans add column if not exists draft_html text`;
  await sql`alter table plans add column if not exists draft_updated_at timestamptz`;
  await sql`alter table plans add column if not exists draft_updated_by text`;
  await sql`alter table plans add column if not exists draft_dirty boolean not null default true`;
  await sql`alter table plans add column if not exists draft_summary text`;
  await sql`alter table plan_versions add column if not exists title text`;
  await sql`alter table plan_versions add column if not exists summary text`;

  await sql`
    update plan_versions v set title = p.title
    from plans p where v.plan_id = p.id and v.title is null
  `;
  // Seed each existing plan's draft from its latest published version and mark
  // it clean, so pre-split plans open with a draft that matches what's live.
  await sql`
    update plans p
    set draft_html = lv.html, draft_updated_at = now(), draft_dirty = false
    from (
      select distinct on (plan_id) plan_id, html
      from plan_versions order by plan_id, version desc
    ) lv
    where lv.plan_id = p.id and p.draft_html is null
  `;
}
