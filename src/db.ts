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
export async function initSchema(): Promise<void> {
  await sql`
    create table if not exists plans (
      id uuid primary key default gen_random_uuid(),
      slug text unique not null,
      title text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists plan_versions (
      id uuid primary key default gen_random_uuid(),
      plan_id uuid not null references plans(id) on delete cascade,
      version integer not null,
      html text not null,
      published_by text,
      created_at timestamptz not null default now(),
      unique (plan_id, version)
    )
  `;
}
