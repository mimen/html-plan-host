import type { Plan, PlanVersion } from "../plans.ts";
import { esc, fmtDate, page } from "./layout.ts";

export function versionsPage(plan: Plan, versions: PlanVersion[]): string {
  const latest = versions[0]?.version ?? 0;
  const items = versions
    .map((v) => {
      const isLatest = v.version === latest;
      const by = v.published_by ? ` &middot; by ${esc(v.published_by)}` : "";
      return `<li>
        <a href="/p/${esc(plan.slug)}/v/${v.version}">Version ${v.version}</a>
        ${isLatest ? '<span class="badge">latest</span>' : ""}
        <div class="muted">${esc(fmtDate(v.created_at))}${by}</div>
      </li>`;
    })
    .join("");

  const body = `
    <header>
      <h1>${esc(plan.title)}</h1>
      <p class="muted">
        <a href="/p/${esc(plan.slug)}">View latest</a> &middot;
        <a href="/">All plans</a>
      </p>
    </header>
    <ul class="versions">${items}</ul>`;

  return page(`Versions — ${plan.title}`, body);
}

// A sticky banner injected at the top of an old version's HTML so the reader
// always knows they are not looking at the current plan.
export function oldVersionBanner(plan: Plan, version: number, latest: number): string {
  return `<div class="banner" style="position:sticky;top:0;background:#fff8e1;border-bottom:1px solid #f0d98c;color:#6b5900;padding:0.6rem 1rem;font:14px/1.4 system-ui,sans-serif;text-align:center;z-index:2147483647;">
    Viewing version ${version} of ${latest}.
    <a href="/p/${esc(plan.slug)}" style="color:#6b5900;font-weight:600;">Jump to latest</a> &middot;
    <a href="/p/${esc(plan.slug)}/versions" style="color:#6b5900;">all versions</a>
  </div>`;
}
