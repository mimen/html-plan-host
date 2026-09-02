import type { PlanSummary } from "../plans.ts";
import { esc, fmtDate, page } from "./layout.ts";

export function dashboardPage(plans: PlanSummary[], email: string): string {
  const cards = plans.length
    ? plans
        .map(
          (p) => `
    <a class="card" href="/p/${esc(p.slug)}">
      <div class="row">
        <h2>${esc(p.title)}</h2>
        <span class="badge">v${p.latest_version}</span>
      </div>
      <div class="muted">
        Updated ${esc(fmtDate(p.updated_at))} &middot;
        <a href="/p/${esc(p.slug)}/versions">${p.version_count} version${p.version_count === 1 ? "" : "s"}</a>
      </div>
    </a>`,
        )
        .join("")
    : `<p class="muted">No plans yet. Publish one with the CLI to see it here.</p>`;

  const identity = email
    ? `Signed in as ${esc(email)} &middot; <a href="/auth/logout">sign out</a>`
    : `Auth disabled`;

  const body = `
    <header>
      <h1>HTML Plans</h1>
      <p class="muted">${identity}</p>
    </header>
    ${cards}
    <footer class="muted">Durable URLs. New publishes create a new version at the same link.</footer>`;

  return page("HTML Plans", body);
}
