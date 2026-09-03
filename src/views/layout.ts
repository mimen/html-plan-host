import { config } from "../config.ts";
import { themeCss } from "../themes.ts";

// Minimal escaping for values interpolated into the chrome pages (dashboard,
// version list). Plan HTML itself is authored by a trusted publisher and served
// verbatim, so it is intentionally not escaped.
export function esc(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function fmtDate(d: Date): string {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// Compact form for the thin top bar, e.g. "Sep 2".
export function fmtShort(d: Date): string {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric" });
}

// Structural CSS for the chrome pages. Colors, fonts, radii, and shadows come
// from theme tokens (see themes.ts), injected as a second <style> after this
// one, so every rule references var(--token) and never hardcodes a palette.
const STYLES = `
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    font-size: 14px; line-height: 1.6; letter-spacing: -0.006em;
    margin: 0; padding: 3rem 1.5rem; color: var(--fg);
    background: var(--bg);
    -webkit-font-smoothing: antialiased;
  }
  .container { max-width: 760px; margin-inline: auto; }

  .page-header { margin-bottom: 2rem; }
  h1 { font-size: 1.6rem; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 0.35rem; }
  .subtitle { color: var(--muted); font-size: 0.85rem; margin: 0; }
  /* Back navigation, above the page title. */
  .back {
    display: inline-flex; align-items: center; gap: 0.25rem; text-decoration: none;
    color: var(--muted); font-size: 0.85rem; font-weight: 500;
    padding: 0.3rem 0.5rem 0.3rem 0.35rem; margin: 0 0 1rem -0.35rem; border-radius: var(--radius-sm);
  }
  .back:hover { color: var(--fg); background: var(--hover-surface); }
  .plan-desc { color: var(--muted); font-size: 0.95rem; line-height: 1.5; margin: 0.35rem 0 0; max-width: 62ch; }
  .card-desc { color: var(--muted); font-size: 0.85rem; line-height: 1.45; margin: 0.4rem 0 0; }
  .subtitle a, .link { color: var(--fg); text-decoration: none; font-weight: 500; }
  .subtitle a:hover, .link:hover { text-decoration: underline; }

  .card-grid { display: flex; flex-direction: column; gap: 0.6rem; }
  .card {
    position: relative; display: block; color: inherit;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 1rem 1.15rem;
    box-shadow: var(--shadow);
    transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.05s ease;
  }
  .card:hover {
    border-color: var(--ring);
    box-shadow: var(--shadow-hover);
  }
  .card:active { transform: translateY(0.5px); }
  .card-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
  .card-title { font-size: 1rem; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
  /* Stretched-link: the title anchor covers the whole card, so clicking
     anywhere opens the plan, without nesting anchors. */
  .card-title a { color: inherit; text-decoration: none; }
  .card-title a::after { content: ""; position: absolute; inset: 0; z-index: 0; }
  .card-meta { color: var(--muted); font-size: 0.8rem; margin: 0.4rem 0 0; }
  .card-meta a { position: relative; z-index: 1; color: var(--muted); text-decoration: underline; text-underline-offset: 2px; }
  .card-meta a:hover { color: var(--fg); }

  .badge {
    display: inline-flex; align-items: center; font-size: 0.72rem; font-weight: 500;
    line-height: 1; padding: 0.32rem 0.6rem; border-radius: 999px; white-space: nowrap;
    background: var(--chip); color: var(--muted);
    border: 1px solid var(--border);
  }
  .badge-solid { background: var(--primary); color: var(--primary-fg); border-color: transparent; }

  .empty {
    border: 1px dashed var(--border); border-radius: var(--radius);
    padding: 2.5rem 1.5rem; text-align: center; color: var(--muted);
  }
  .empty code { background: var(--chip); padding: 0.15rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.85em; }

  .version-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .version-item {
    position: relative; display: flex; flex-direction: column; gap: 0.4rem;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 0.8rem 1rem;
    box-shadow: var(--shadow);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .version-item:hover {
    border-color: var(--ring);
    box-shadow: var(--shadow-hover);
  }
  .vi-head { display: flex; align-items: center; gap: 0.75rem; }
  .version-item .num { font-weight: 600; text-decoration: none; color: var(--fg); }
  /* Whole-row click: the version anchor stretches over the entire row. */
  .version-item .num::after { content: ""; position: absolute; inset: 0; z-index: 0; }
  .version-item .when { color: var(--muted); font-size: 0.8rem; margin-left: auto; }
  .vi-summary { margin: 0; color: var(--muted); font-size: 0.85rem; line-height: 1.45; }

  .section-label {
    font-size: 0.74rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--muted); margin: 1.6rem 0 0.6rem;
  }
  .version-item.draft-row { border-style: dashed; }

  footer { margin-top: 2.5rem; color: var(--muted); font-size: 0.8rem; }

  .prose p { margin: 0 0 1rem; }
  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 0.85rem; font-weight: 500; text-decoration: none;
    padding: 0.5rem 0.9rem; border-radius: calc(var(--radius) - 0.15rem);
    background: var(--primary); color: var(--primary-fg);
    border: 1px solid transparent;
  }
  .btn:hover { opacity: 0.9; }
`;

export function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${esc(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,600&display=swap" rel="stylesheet">
  <style>${STYLES}</style>
  <style>${themeCss(config.theme)}</style>
</head>
<body><div class="container">${body}</div></body>
</html>`;
}
