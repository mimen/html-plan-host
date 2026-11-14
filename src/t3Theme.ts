// T3 Code's html_render injects these tokens and base rules into every page it shows.
// The host injects the same ones, so a page written for html_render reads the same here.
// Snapshot of htmlRenderTheme(T3_CODE_{DARK,LIGHT}_THEME_COLORS) and BASE_CSS in
// mimen/t3code packages/shared/src/htmlRender.ts at e376a50e72.
// ponytail: copied, not imported; re-run that function if T3's default palette changes.
const DARK =
  ':root{color-scheme:dark;--background:#0a0a0a;--foreground:#f5f5f5;--muted:#111111;--muted-foreground:#818181;--card:#111111;--card-foreground:#f5f5f5;--popover:#111111;--popover-foreground:#f5f5f5;--secondary:#111111;--secondary-foreground:#f5f5f5;--border:#191919;--input:#1e1e1e;--ring:#346bf1;--primary:#346bf1;--primary-foreground:#ffffff;--accent:#346bf1;--accent-foreground:#ffffff;--accent-surface:#141414;--accent-surface-foreground:#f5f5f5;--destructive:#fb414a;--destructive-foreground:#ff6467;--destructive-surface:#301214;--warning:#fe9a00;--warning-foreground:#ffb900;--warning-surface:#312108;--success:#10b981;--success-foreground:#34d399;--info:#3b82f6;--info-foreground:#60a5fa;--code-background:#111111;--code-foreground:#f5f5f5;--chart-1:#346bf1;--chart-2:#2dd4bf;--chart-3:#fbbf24;--chart-4:#c084fc;--chart-5:#fb7185;--chart-6:#a3e635;--radius:0.625rem;--font-sans:-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;--font-mono:"SF Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;}';
const LIGHT =
  ':root{color-scheme:light;--background:#fcfcfc;--foreground:#27272a;--muted:#fafafa;--muted-foreground:#71717b;--card:#ffffff;--card-foreground:#27272a;--popover:#ffffff;--popover-foreground:#27272a;--secondary:#fafafa;--secondary-foreground:#27272a;--border:#e4e4e7;--input:#d4d4d8;--ring:#1b4ed8;--primary:#1b4ed8;--primary-foreground:#ffffff;--accent:#1b4ed8;--accent-foreground:#ffffff;--accent-surface:#f4f4f5;--accent-surface-foreground:#18181b;--destructive:#fb2c36;--destructive-foreground:#c10007;--destructive-surface:#fcebec;--warning:#fe9a00;--warning-foreground:#bb4d00;--warning-surface:#fcf4e8;--success:#10b981;--success-foreground:#047857;--info:#3b82f6;--info-foreground:#1d4ed8;--code-background:#ffffff;--code-foreground:#27272a;--chart-1:#1b4ed8;--chart-2:#0d9488;--chart-3:#d97706;--chart-4:#9333ea;--chart-5:#e11d48;--chart-6:#65a30d;--radius:0.625rem;--font-sans:-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;--font-mono:"SF Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;}';
const BASE =
  "html{box-sizing:border-box;padding:8px;background:var(--background);color:var(--foreground);font-family:var(--font-sans);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%}" +
  "body{margin:0}code,kbd,pre,samp{font-family:var(--font-mono)}" +
  ":where(:focus-visible){outline:2px solid var(--ring)}";
// T3 frames a page at the 728px reply column. A full browser window gets a centered column and room to breathe.
const HOST = "@media (min-width:800px){html{padding:32px 24px}body{max-width:1144px;margin-inline:auto}}";

const STYLE = `<style id="t3-theme">${DARK}@media (prefers-color-scheme: light){${LIGHT}}${BASE}${HOST}</style>`;

// A page that paints its own canvas (the legacy plan themes) keeps it untouched.
const OWN_CANVAS = /(?:^|[\s,}>])(?:html|body|:root)\b[^{}]*\{[^}]*\bbackground(?:-color)?\s*:/i;
const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;

export function paintsOwnCanvas(html: string): boolean {
  for (const [, css] of html.matchAll(STYLE_BLOCK)) if (OWN_CANVAS.test(css ?? "")) return true;
  return false;
}

export function withT3Theme(html: string): string {
  if (paintsOwnCanvas(html)) return html;
  const at = /<head\b[^>]*>/i.exec(html) ?? /<html\b[^>]*>/i.exec(html) ?? /^\s*<!doctype[^>]*>/i.exec(html);
  if (!at) return STYLE + html;
  const end = at.index + at[0].length;
  return html.slice(0, end) + STYLE + html.slice(end);
}
