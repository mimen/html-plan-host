import type { PlanSummary } from "../plans.ts";
import { esc, fmtDate, page } from "./layout.ts";

export function dashboardPage(plans: PlanSummary[], email: string): string {
  const cards = plans.length
    ? `<div class="card-grid">${plans
        .map((p) => {
          // A plan with no published version links to its draft; otherwise the
          // card opens the latest published version.
          const published = p.latest_version !== null;
          const href = published ? `/p/${esc(p.slug)}` : `/p/${esc(p.slug)}/draft`;
          const badge = published
            ? `<span class="badge">v${p.latest_version}</span>`
            : `<span class="badge stale">Draft</span>`;
          const draftFlag = published && p.draft_dirty
            ? ` &middot; <a href="/p/${esc(p.slug)}/draft">draft in progress</a>`
            : "";
          const versionsLink = published
            ? `<a href="/p/${esc(p.slug)}/versions">${p.version_count} version${p.version_count === 1 ? "" : "s"}</a>${draftFlag}`
            : `<a href="/p/${esc(p.slug)}/versions">history</a>`;
          const description = p.description
            ? `<p class="card-desc">${esc(p.description)}</p>`
            : "";
          return `
        <div class="card">
          <div class="card-row">
            <h2 class="card-title"><a href="${href}">${esc(p.title)}</a></h2>
            ${badge}
          </div>
          ${description}
          <p class="card-meta">Updated ${esc(fmtDate(p.updated_at))} &middot; ${versionsLink}</p>
        </div>`;
        })
        .join("")}</div>`
    : `<div class="empty">No plans yet. Publish one with <code>bin/publish.mjs</code> and it'll show up here.</div>`;

  const identity = email
    ? `Signed in as ${esc(email)} &middot; <a href="/auth/logout">sign out</a>`
    : `Auth disabled`;

  const body = `
    <header class="page-header">
      <h1>HTML Plans</h1>
      <p class="subtitle">${identity}</p>
    </header>
    ${cards}
    <footer>Durable URLs. Publishing again creates a new version at the same link.</footer>`;

  return page("HTML Plans", body);
}
