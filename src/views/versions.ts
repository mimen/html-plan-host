import type { Plan, PlanVersion } from "../plans.ts";
import { config } from "../config.ts";
import { themeCss } from "../themes.ts";
import { esc, fmtDate, fmtShort, page } from "./layout.ts";

export function versionsPage(plan: Plan, versions: PlanVersion[]): string {
  const latest = versions[0]?.version ?? 0;

  // Only surface the draft when it has something the published list doesn't:
  // unpublished changes, or nothing published yet.
  const showDraft = plan.draft_dirty || versions.length === 0;
  const draftWhen = plan.draft_updated_at ? esc(fmtDate(plan.draft_updated_at)) : "";
  const draftSummary = plan.draft_summary
    ? `<p class="vi-summary">${esc(plan.draft_summary)}</p>`
    : "";
  const draftBlock = showDraft
    ? `<h2 class="section-label">Draft</h2>
       <ul class="version-list">
         <li class="version-item draft-row">
           <div class="vi-head">
             <a class="num" href="/p/${esc(plan.slug)}/draft">Working draft</a>
             <span class="badge stale">${plan.draft_dirty ? "unpublished changes" : "never published"}</span>
             <span class="when">${draftWhen}</span>
           </div>
           ${draftSummary}
         </li>
       </ul>`
    : "";

  const items = versions
    .map((v) => {
      const isLatest = v.version === latest;
      const by = v.published_by ? ` &middot; by ${esc(v.published_by)}` : "";
      const summary = v.summary ? `<p class="vi-summary">${esc(v.summary)}</p>` : "";
      return `<li class="version-item">
        <div class="vi-head">
          <a class="num" href="/p/${esc(plan.slug)}/v/${v.version}">Version ${v.version}</a>
          ${isLatest ? '<span class="badge badge-solid">latest</span>' : ""}
          <span class="when">${esc(fmtDate(v.created_at))}${by}</span>
        </div>
        ${summary}
      </li>`;
    })
    .join("");

  const published = versions.length
    ? `<ul class="version-list">${items}</ul>`
    : `<div class="empty">No published versions yet. Open the draft and click <strong>Publish version</strong> to mint v1.</div>`;

  const description = plan.description ? `<p class="plan-desc">${esc(plan.description)}</p>` : "";
  const body = `
    <a class="back" href="/">&lsaquo; All plans</a>
    <header class="page-header">
      <h1>${esc(plan.title)}</h1>
      ${description}
    </header>
    ${draftBlock}
    <h2 class="section-label">Published</h2>
    ${published}`;

  return page(`Versions — ${plan.title}`, body);
}

export type FrameView =
  | { kind: "version"; version: number; latest: number; dirty: boolean; publishedAt: Date; summary: string | null }
  | { kind: "draft"; dirty: boolean; latestPublished: number | null; updatedAt: Date | null; summary: string | null };

// Wrapper page: a thin top bar plus the plan HTML in an untouched iframe below.
// Layout is three stable zones. Left is the breadcrumb (the only bold element).
// Center-right is the single version-info location (a pager, or the draft
// state) with its timestamp. Right is the contextual action then Versions,
// which is always last. An optional second line carries the change summary.
export function planFramePage(plan: Plan, view: FrameView, rawSrc: string): string {
  const slug = esc(plan.slug);
  let statusZone: string;
  let action = "";
  let summaryLead = "";
  let summaryText: string | null = null;

  if (view.kind === "version") {
    const isLatest = view.version >= view.latest;
    const prev = view.version > 1
      ? `<a class="arrow" href="/p/${slug}/v/${view.version - 1}" title="Older version">&lsaquo;</a>`
      : `<span class="arrow off">&lsaquo;</span>`;
    const next = view.version < view.latest
      ? `<a class="arrow" href="/p/${slug}/v/${view.version + 1}" title="Newer version">&rsaquo;</a>`
      : `<span class="arrow off">&rsaquo;</span>`;
    const sub = isLatest ? "latest" : `of ${view.latest}`;
    const ts = `<span class="ts" title="Published ${esc(fmtDate(view.publishedAt))}">${esc(fmtShort(view.publishedAt))}</span>`;
    statusZone = `<span class="pager">${prev}<span class="state">v${view.version} <span class="sub">${sub}</span></span>${next}</span>${ts}`;

    if (view.dirty) {
      action = `<a class="btn accent" href="/p/${slug}/draft" title="View working draft"><span class="dot blue"></span>Draft</a>`;
    }
    summaryLead = `In v${view.version}`;
    summaryText = view.summary;
  } else {
    const sub = view.dirty ? "unpublished" : "up to date";
    const dot = view.dirty ? "amber" : "";
    const ts = view.updatedAt
      ? `<span class="ts" title="Draft updated ${esc(fmtDate(view.updatedAt))}">updated ${esc(fmtShort(view.updatedAt))}</span>`
      : "";
    statusZone = `<span class="state"><span class="dot ${dot}"></span>Draft <span class="sub">${sub}</span></span>${ts}`;

    if (view.dirty) {
      action = `<form method="post" action="/p/${slug}/publish" style="margin:0"><button type="submit" class="btn primary">Publish version</button></form>`;
    }
    summaryLead = view.latestPublished ? `Since v${view.latestPublished}` : "Pending";
    summaryText = view.summary;
  }

  const subbar = summaryText
    ? `<div class="subbar"><span class="lead">${esc(summaryLead)}</span><span class="txt">${esc(summaryText)}</span></div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${esc(plan.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,600&display=swap" rel="stylesheet">
  <style>
    html, body { margin: 0; height: 100%; }
    body { display: flex; flex-direction: column; }
    .chrome { flex: none; }
    .bar {
      height: 44px; box-sizing: border-box; display: flex; align-items: center; gap: 0.4rem;
      padding: 0 12px; font-weight: 400; font-size: 12.5px; line-height: 1;
      letter-spacing: -0.003em; color: var(--muted);
      background: var(--surface); border-bottom: 1px solid var(--border);
    }
    .bar .spacer { flex: 1; }

    .crumb { text-decoration: none; color: var(--muted); padding: 0.3rem 0.4rem; border-radius: var(--radius-sm); }
    .crumb.home:hover { color: var(--fg); background: var(--hover-surface); }
    .crumb.sep { padding: 0; opacity: 0.45; }
    .crumb.title { color: var(--fg); font-weight: 600; font-size: 13px; padding-left: 0.15rem; }

    .pager { display: inline-flex; align-items: center; gap: 0.1rem; }
    .arrow { text-decoration: none; color: var(--muted); font-size: 16px; padding: 0.2rem 0.4rem; border-radius: var(--radius-sm); }
    .arrow:hover { color: var(--fg); background: var(--hover-surface); }
    .arrow.off { opacity: 0.25; }
    .state { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--fg); font-weight: 500; padding: 0 0.35rem; }
    .state .sub { color: var(--muted); font-weight: 400; }
    .ts { color: var(--muted); font-weight: 400; margin: 0 0.2rem 0 0.1rem; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
    .dot.amber { background: var(--stale); }
    .dot.blue { background: var(--accent); }

    .btn {
      display: inline-flex; align-items: center; gap: 0.35rem; text-decoration: none;
      font-weight: 500; font-size: 12.5px; line-height: 1; cursor: pointer;
      padding: 0.4rem 0.62rem; border-radius: var(--radius-sm); border: 1px solid transparent; color: var(--muted);
    }
    .btn.ghost:hover { color: var(--fg); background: var(--hover-surface); }
    .btn.accent { color: var(--accent); background: var(--accent-soft); }
    .btn.accent:hover { background: var(--accent-soft); }
    .btn.primary { color: var(--primary-fg); background: var(--primary); font-weight: 600; }
    .btn.primary:hover { opacity: 0.9; }

    .subbar {
      display: flex; align-items: baseline; gap: 0.5rem; padding: 7px 14px;
      font-weight: 400; font-size: 12px; line-height: 1.45;
      background: var(--surface); border-bottom: 1px solid var(--border);
    }
    .subbar .lead { font-weight: 600; color: var(--fg); white-space: nowrap; }
    .subbar .txt { color: var(--muted); }

    iframe { flex: 1 1 auto; width: 100%; border: 0; display: block; background: var(--iframe-bg); }
  </style>
  <style>${themeCss(config.theme)}</style>
</head>
<body>
  <header class="chrome">
    <div class="bar">
      <a class="crumb home" href="/">Plans</a>
      <span class="crumb sep">/</span>
      <span class="crumb title">${esc(plan.title)}</span>
      <span class="spacer"></span>
      ${statusZone}
      ${action}
      <a class="btn ghost" href="/p/${slug}/versions">Versions</a>
    </div>
    ${subbar}
  </header>
  <iframe src="${esc(rawSrc)}" title="${esc(plan.title)}"></iframe>
</body>
</html>`;
}
