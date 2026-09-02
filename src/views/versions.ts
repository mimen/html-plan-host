import type { Plan, PlanVersion } from "../plans.ts";
import { esc, fmtDate, page } from "./layout.ts";

export function versionsPage(plan: Plan, versions: PlanVersion[]): string {
  const latest = versions[0]?.version ?? 0;
  const items = versions
    .map((v) => {
      const isLatest = v.version === latest;
      const by = v.published_by ? ` &middot; by ${esc(v.published_by)}` : "";
      return `<li class="version-item">
        <a class="num" href="/p/${esc(plan.slug)}/v/${v.version}">Version ${v.version}</a>
        ${isLatest ? '<span class="badge badge-solid">latest</span>' : ""}
        <span class="when">${esc(fmtDate(v.created_at))}${by}</span>
      </li>`;
    })
    .join("");

  const body = `
    <header class="page-header">
      <h1>${esc(plan.title)}</h1>
      <p class="subtitle">
        <a href="/p/${esc(plan.slug)}">View latest</a> &middot;
        <a href="/">All plans</a>
      </p>
    </header>
    <ul class="version-list">${items}</ul>`;

  return page(`Versions — ${plan.title}`, body);
}

// Wrapper page for viewing an old version: a thin bar on top with the plan
// itself rendered untouched in an iframe below. The bar lives entirely outside
// the plan document, so it can neither style nor be styled by the plan, and the
// stored HTML is served byte-for-byte inside the frame.
export function planFramePage(
  plan: Plan,
  version: number,
  latest: number,
  rawSrc: string,
): string {
  const isLatest = version >= latest;
  const status = isLatest
    ? `<span class="badge">v${version} &middot; latest</span>`
    : `<span class="badge stale">v${version} of ${latest}</span>`;
  const latestLink = isLatest ? "" : `<a href="/p/${esc(plan.slug)}">Latest</a>`;

  // Versions are contiguous 1..latest, so adjacency needs no query.
  const prev = version > 1
    ? `<a class="nav" href="/p/${esc(plan.slug)}/v/${version - 1}" title="Older version">&lsaquo; v${version - 1}</a>`
    : `<span class="nav off">&lsaquo;</span>`;
  const next = version < latest
    ? `<a class="nav" href="/p/${esc(plan.slug)}/v/${version + 1}" title="Newer version">v${version + 1} &rsaquo;</a>`
    : `<span class="nav off">&rsaquo;</span>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${esc(plan.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bar: 0 0% 100%; --fg: 240 10% 3.9%; --muted: 240 3.8% 46.1%;
      --border: 240 5.9% 90%; --chip: 240 4.8% 95.9%; --stale: 38 92% 50%;
    }
    @media (prefers-color-scheme: dark) {
      :root { --bar: 240 6% 10%; --fg: 0 0% 98%; --muted: 240 5% 64.9%;
        --border: 240 3.7% 15.9%; --chip: 240 3.7% 15.9%; --stale: 38 92% 55%; }
    }
    html, body { margin: 0; height: 100%; }
    .bar {
      height: 40px; box-sizing: border-box; display: flex; align-items: center; gap: 0.55rem;
      padding: 0 12px; font: 500 12.5px/1 "Inter", -apple-system, system-ui, sans-serif;
      letter-spacing: -0.005em; color: hsl(var(--muted));
      background: hsl(var(--bar)); border-bottom: 1px solid hsl(var(--border));
    }
    .bar .title { font-weight: 600; color: hsl(var(--fg)); }
    .bar .sep { opacity: 0.5; }
    .bar .home { display: inline-flex; align-items: center; }
    .bar a {
      color: hsl(var(--fg)); text-decoration: none; padding: 0.32rem 0.55rem;
      border-radius: 7px; border: 1px solid hsl(var(--border));
    }
    .bar a:hover { background: hsl(var(--fg) / 0.05); }
    .bar .badge {
      color: hsl(var(--muted)); border: 1px solid hsl(var(--border));
      background: hsl(var(--chip)); padding: 0.3rem 0.55rem; border-radius: 999px; font-weight: 500;
    }
    .bar .badge.stale { color: hsl(var(--stale)); border-color: hsl(var(--stale) / 0.4); background: hsl(var(--stale) / 0.12); }
    .bar .nav.off {
      opacity: 0.3; padding: 0.32rem 0.55rem; border: 1px solid hsl(var(--border));
      border-radius: 7px; cursor: default;
    }
    .bar .spacer { flex: 1; }
    iframe { border: 0; width: 100%; height: calc(100% - 40px); display: block; background: #fff; }
  </style>
</head>
<body>
  <div class="bar">
    <a class="home" href="/">Plans</a>
    <span class="sep">/</span>
    <span class="title">${esc(plan.title)}</span>
    ${status}
    <span class="spacer"></span>
    ${prev}${next}
    ${latestLink}
    <a href="/p/${esc(plan.slug)}/versions">Versions</a>
  </div>
  <iframe src="${esc(rawSrc)}" title="${esc(plan.title)} (version ${version})"></iframe>
</body>
</html>`;
}
