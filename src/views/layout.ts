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

// shadcn-style design tokens (zinc), reproduced as plain CSS variables so the
// service keeps its zero-build, server-rendered footprint. Colors are HSL
// channels consumed via hsl(var(--token)). Dark mode follows the OS.
const STYLES = `
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --border: 240 5.9% 90%;
    --accent: 240 4.8% 95.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --ring: 240 5% 65%;
    --radius: 0.65rem;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --background: 240 10% 3.9%;
      --foreground: 0 0% 98%;
      --card: 240 6% 10%;
      --muted: 240 3.7% 15.9%;
      --muted-foreground: 240 5% 64.9%;
      --border: 240 3.7% 15.9%;
      --accent: 240 3.7% 15.9%;
      --primary: 0 0% 98%;
      --primary-foreground: 240 5.9% 10%;
      --ring: 240 4.9% 40%;
    }
  }

  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 14px; line-height: 1.6; letter-spacing: -0.006em;
    margin: 0; padding: 3rem 1.5rem; color: hsl(var(--foreground));
    background: hsl(var(--background));
    -webkit-font-smoothing: antialiased;
  }
  .container { max-width: 760px; margin-inline: auto; }

  .page-header { margin-bottom: 2rem; }
  h1 { font-size: 1.6rem; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 0.35rem; }
  .subtitle { color: hsl(var(--muted-foreground)); font-size: 0.85rem; margin: 0; }
  /* Back navigation, above the page title. */
  .back {
    display: inline-flex; align-items: center; gap: 0.25rem; text-decoration: none;
    color: hsl(var(--muted-foreground)); font-size: 0.85rem; font-weight: 500;
    padding: 0.3rem 0.5rem 0.3rem 0.35rem; margin: 0 0 1rem -0.35rem; border-radius: 7px;
  }
  .back:hover { color: hsl(var(--foreground)); background: hsl(var(--foreground) / 0.05); }
  .plan-desc { color: hsl(var(--muted-foreground)); font-size: 0.95rem; line-height: 1.5; margin: 0.35rem 0 0; max-width: 62ch; }
  .card-desc { color: hsl(var(--muted-foreground)); font-size: 0.85rem; line-height: 1.45; margin: 0.4rem 0 0; }
  .subtitle a, .link { color: hsl(var(--foreground)); text-decoration: none; font-weight: 500; }
  .subtitle a:hover, .link:hover { text-decoration: underline; }

  .card-grid { display: flex; flex-direction: column; gap: 0.6rem; }
  .card {
    position: relative; display: block; color: inherit;
    background: hsl(var(--card)); border: 1px solid hsl(var(--border));
    border-radius: var(--radius); padding: 1rem 1.15rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.05s ease;
  }
  .card:hover {
    border-color: hsl(var(--ring));
    box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04), 0 6px 20px hsl(var(--foreground) / 0.05);
  }
  .card:active { transform: translateY(0.5px); }
  .card-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
  .card-title { font-size: 1rem; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
  /* Stretched-link: the title anchor covers the whole card, so clicking
     anywhere opens the plan, without nesting anchors. */
  .card-title a { color: inherit; text-decoration: none; }
  .card-title a::after { content: ""; position: absolute; inset: 0; z-index: 0; }
  .card-meta { color: hsl(var(--muted-foreground)); font-size: 0.8rem; margin: 0.4rem 0 0; }
  .card-meta a { position: relative; z-index: 1; color: hsl(var(--muted-foreground)); text-decoration: underline; text-underline-offset: 2px; }
  .card-meta a:hover { color: hsl(var(--foreground)); }

  .badge {
    display: inline-flex; align-items: center; font-size: 0.72rem; font-weight: 500;
    line-height: 1; padding: 0.32rem 0.6rem; border-radius: 999px; white-space: nowrap;
    background: hsl(var(--muted)); color: hsl(var(--muted-foreground));
    border: 1px solid hsl(var(--border));
  }
  .badge-solid { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-color: transparent; }

  .empty {
    border: 1px dashed hsl(var(--border)); border-radius: var(--radius);
    padding: 2.5rem 1.5rem; text-align: center; color: hsl(var(--muted-foreground));
  }
  .empty code { background: hsl(var(--muted)); padding: 0.15rem 0.4rem; border-radius: 6px; font-size: 0.85em; }

  .version-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .version-item {
    position: relative; display: flex; flex-direction: column; gap: 0.4rem;
    background: hsl(var(--card)); border: 1px solid hsl(var(--border));
    border-radius: var(--radius); padding: 0.8rem 1rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .version-item:hover {
    border-color: hsl(var(--ring));
    box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04), 0 6px 20px hsl(var(--foreground) / 0.05);
  }
  .vi-head { display: flex; align-items: center; gap: 0.75rem; }
  .version-item .num { font-weight: 600; text-decoration: none; color: hsl(var(--foreground)); }
  /* Whole-row click: the version anchor stretches over the entire row. */
  .version-item .num::after { content: ""; position: absolute; inset: 0; z-index: 0; }
  .version-item .when { color: hsl(var(--muted-foreground)); font-size: 0.8rem; margin-left: auto; }
  .vi-summary { margin: 0; color: hsl(var(--muted-foreground)); font-size: 0.85rem; line-height: 1.45; }

  .section-label {
    font-size: 0.74rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    color: hsl(var(--muted-foreground)); margin: 1.6rem 0 0.6rem;
  }
  .version-item.draft-row { border-style: dashed; }

  footer { margin-top: 2.5rem; color: hsl(var(--muted-foreground)); font-size: 0.8rem; }

  .prose p { margin: 0 0 1rem; }
  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 0.85rem; font-weight: 500; text-decoration: none;
    padding: 0.5rem 0.9rem; border-radius: calc(var(--radius) - 0.15rem);
    background: hsl(var(--primary)); color: hsl(var(--primary-foreground));
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${STYLES}</style>
</head>
<body><div class="container">${body}</div></body>
</html>`;
}
