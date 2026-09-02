import type { Plan, PlanVersion } from "../plans.ts";
import { esc, fmtDate, page } from "./layout.ts";

export function versionsPage(plan: Plan, versions: PlanVersion[]): string {
  const latest = versions[0]?.version ?? 0;
  const draftNote = plan.draft_dirty
    ? "unpublished changes"
    : latest > 0
      ? `matches v${latest}`
      : "never published";
  const draftWhen = plan.draft_updated_at ? esc(fmtDate(plan.draft_updated_at)) : "";

  const draftRow = `<li class="version-item draft-row">
    <a class="num" href="/p/${esc(plan.slug)}/draft">Working draft</a>
    <span class="badge ${plan.draft_dirty ? "stale" : ""}">${draftNote}</span>
    <span class="when">${draftWhen}</span>
  </li>`;

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

  const published = versions.length
    ? `<ul class="version-list">${items}</ul>`
    : `<div class="empty">No published versions yet. Open the draft and click <strong>Publish version</strong> to mint v1.</div>`;

  const body = `
    <header class="page-header">
      <h1>${esc(plan.title)}</h1>
      <p class="subtitle"><a href="/">All plans</a></p>
    </header>
    <ul class="version-list">${draftRow}</ul>
    <h2 class="section-label">Published</h2>
    ${published}`;

  return page(`Versions — ${plan.title}`, body);
}

export type FrameView =
  | { kind: "version"; version: number; latest: number; dirty: boolean }
  | { kind: "draft"; dirty: boolean; latestPublished: number | null };

// Wrapper page: a thin top bar plus the plan HTML in an untouched iframe below.
// The bar adapts to what's being viewed (a published version or the draft), so
// it can neither style nor be styled by the plan.
export function planFramePage(plan: Plan, view: FrameView, rawSrc: string): string {
  const slug = esc(plan.slug);
  let chip: string;
  let nav: string;

  if (view.kind === "version") {
    const isLatest = view.version >= view.latest;
    chip = isLatest
      ? `<span class="badge">v${view.version} &middot; latest</span>`
      : `<span class="badge stale">v${view.version} of ${view.latest}</span>`;

    const prev = view.version > 1
      ? `<a class="nav" href="/p/${slug}/v/${view.version - 1}" title="Older version">&lsaquo; v${view.version - 1}</a>`
      : `<span class="nav off">&lsaquo;</span>`;
    const next = view.version < view.latest
      ? `<a class="nav" href="/p/${slug}/v/${view.version + 1}" title="Newer version">v${view.version + 1} &rsaquo;</a>`
      : `<span class="nav off">&rsaquo;</span>`;
    const latestLink = isLatest ? "" : `<a href="/p/${slug}">Latest</a>`;
    const draftBtn = view.dirty
      ? `<a class="pill draft" href="/p/${slug}/draft">&#9679; Draft in progress</a>`
      : "";

    nav = `${prev}${next}${latestLink}${draftBtn}<a href="/p/${slug}/versions">Versions</a>`;
  } else {
    chip = view.dirty
      ? `<span class="badge stale">Draft &middot; unpublished</span>`
      : `<span class="badge">Draft &middot; up to date</span>`;

    const publish = view.dirty
      ? `<form method="post" action="/p/${slug}/publish" style="margin:0"><button type="submit" class="pill publish">Publish version</button></form>`
      : `<span class="nav off">Up to date</span>`;
    const publishedLink = view.latestPublished
      ? `<a href="/p/${slug}">v${view.latestPublished} published</a>`
      : "";

    nav = `${publish}${publishedLink}<a href="/p/${slug}/versions">Versions</a>`;
  }

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
      --border: 240 5.9% 90%; --chip: 240 4.8% 95.9%; --stale: 38 92% 45%; --blue: 217 91% 55%;
    }
    @media (prefers-color-scheme: dark) {
      :root { --bar: 240 6% 10%; --fg: 0 0% 98%; --muted: 240 5% 64.9%;
        --border: 240 3.7% 15.9%; --chip: 240 3.7% 15.9%; --stale: 38 92% 60%; --blue: 217 91% 65%; }
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
    .bar a, .bar .nav {
      color: hsl(var(--fg)); text-decoration: none; padding: 0.32rem 0.55rem;
      border-radius: 7px; border: 1px solid hsl(var(--border));
    }
    .bar a:hover { background: hsl(var(--fg) / 0.05); }
    .bar .nav.off { opacity: 0.3; cursor: default; }
    .bar .badge {
      color: hsl(var(--muted)); border: 1px solid hsl(var(--border));
      background: hsl(var(--chip)); padding: 0.3rem 0.55rem; border-radius: 999px; font-weight: 500;
    }
    .bar .badge.stale { color: hsl(var(--stale)); border-color: hsl(var(--stale) / 0.4); background: hsl(var(--stale) / 0.12); }
    .bar .pill.draft {
      color: hsl(var(--blue)); border-color: hsl(var(--blue) / 0.45); background: hsl(var(--blue) / 0.12); font-weight: 600;
    }
    .bar .pill.draft:hover { background: hsl(var(--blue) / 0.2); }
    .bar .pill.publish {
      font: inherit; font-weight: 600; cursor: pointer;
      color: hsl(var(--bar)); background: hsl(var(--fg)); border: 1px solid transparent;
      padding: 0.36rem 0.7rem; border-radius: 7px;
    }
    .bar .pill.publish:hover { opacity: 0.9; }
    .bar .spacer { flex: 1; }
    iframe { border: 0; width: 100%; height: calc(100% - 40px); display: block; background: #fff; }
  </style>
</head>
<body>
  <div class="bar">
    <a class="home" href="/">Plans</a>
    <span class="sep">/</span>
    <span class="title">${esc(plan.title)}</span>
    ${chip}
    <span class="spacer"></span>
    ${nav}
  </div>
  <iframe src="${esc(rawSrc)}" title="${esc(plan.title)}"></iframe>
</body>
</html>`;
}
