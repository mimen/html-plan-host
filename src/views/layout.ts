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

const STYLES = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    margin: 0; padding: 2.5rem 1.5rem; max-width: 860px; margin-inline: auto;
    color: #1a1a1a; background: #fafafa;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #e6e6e6; background: #16181d; }
    a { color: #7aa2ff; }
    .card { background: #1e2128 !important; border-color: #2c3038 !important; }
    .muted { color: #9aa0aa !important; }
    .banner { background: #2a2410 !important; border-color: #4d4320 !important; color: #f0e6c0 !important; }
  }
  h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
  header p { margin: 0 0 2rem; }
  a { color: #2b5fff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .muted { color: #666; font-size: 0.85rem; }
  .card {
    display: block; background: #fff; border: 1px solid #e5e5e5; border-radius: 10px;
    padding: 1rem 1.25rem; margin-bottom: 0.75rem; text-decoration: none; color: inherit;
  }
  .card:hover { border-color: #2b5fff; text-decoration: none; }
  .card h2 { font-size: 1.05rem; margin: 0 0 0.35rem; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
  .badge {
    font-size: 0.75rem; background: #eef1f8; color: #33415c; border-radius: 20px;
    padding: 0.1rem 0.55rem; white-space: nowrap;
  }
  .banner {
    position: sticky; top: 0; background: #fff8e1; border-bottom: 1px solid #f0d98c;
    color: #6b5900; padding: 0.6rem 1rem; font-size: 0.85rem; text-align: center; z-index: 9999;
  }
  ul.versions { list-style: none; padding: 0; }
  ul.versions li { padding: 0.6rem 0; border-bottom: 1px solid #e5e5e5; }
  footer { margin-top: 2.5rem; }
`;

export function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${esc(title)}</title>
  <style>${STYLES}</style>
</head>
<body>${body}</body>
</html>`;
}
