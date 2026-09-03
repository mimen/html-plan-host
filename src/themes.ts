export interface Theme {
  label: string;
  css: string;
}

interface Tokens {
  bg: string;
  fg: string;
  muted: string;
  surface: string;
  chip: string;
  border: string;
  ring: string;
  accent: string;
  accentSoft: string;
  primary: string;
  primaryFg: string;
  stale: string;
  radius: string;
  radiusSm: string;
  shadow: string;
  shadowHover: string;
  hoverSurface: string;
  iframeBg: string;
}

function sheet(t: Tokens, font: string, overrides = ""): string {
  return `
    :root {
      --bg: ${t.bg};
      --fg: ${t.fg};
      --muted: ${t.muted};
      --surface: ${t.surface};
      --chip: ${t.chip};
      --border: ${t.border};
      --ring: ${t.ring};
      --accent: ${t.accent};
      --accent-soft: ${t.accentSoft};
      --primary: ${t.primary};
      --primary-fg: ${t.primaryFg};
      --stale: ${t.stale};
      --radius: ${t.radius};
      --radius-sm: ${t.radiusSm};
      --shadow: ${t.shadow};
      --shadow-hover: ${t.shadowHover};
      --hover-surface: ${t.hoverSurface};
      --iframe-bg: ${t.iframeBg};
    }
    body { font-family: ${font}; }
    ${overrides}`;
}

export const THEMES: Record<string, Theme> = {
  zinc: {
    label: "Zinc",
    css: sheet(
      {
        bg: "#fff",
        fg: "#18181b",
        muted: "#71717a",
        surface: "#fff",
        chip: "#f4f4f5",
        border: "#e4e4e7",
        ring: "#a1a1aa",
        accent: "#2563eb",
        accentSoft: "rgba(37,99,235,.10)",
        primary: "#18181b",
        primaryFg: "#fafafa",
        stale: "#d97706",
        radius: ".65rem",
        radiusSm: "7px",
        shadow: "none",
        shadowHover: "0 1px 2px rgba(24,24,27,.04), 0 6px 20px rgba(24,24,27,.06)",
        hoverSurface: "rgba(24,24,27,.05)",
        iframeBg: "#fff",
      },
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    ),
  },
  editorial: {
    label: "Editorial",
    css: sheet(
      {
        bg: "#f8f5ef",
        fg: "#2b2620",
        muted: "#726858",
        surface: "#fffdf8",
        chip: "#efe8da",
        border: "#e6ddcc",
        ring: "#c9b89d",
        accent: "#9a3b2e",
        accentSoft: "rgba(154,59,46,.10)",
        primary: "#2b2620",
        primaryFg: "#f8f5ef",
        stale: "#b06a1e",
        radius: "5px",
        radiusSm: "4px",
        shadow: "none",
        shadowHover: "0 1px 2px rgba(43,38,32,.05), 0 6px 18px rgba(43,38,32,.07)",
        hoverSurface: "rgba(43,38,32,.05)",
        iframeBg: "#fffdf8",
      },
      "'Inter', -apple-system, system-ui, sans-serif",
      `h1, .card-title, .card-title a, .crumb.title { font-family: 'Newsreader', Georgia, serif; font-weight: 600; letter-spacing: .01em; }`,
    ),
  },
  linear: {
    label: "Linear",
    css: sheet(
      {
        bg: "#16151c",
        fg: "#e9e8f0",
        muted: "#8b899a",
        surface: "#1c1b25",
        chip: "#232231",
        border: "#282734",
        ring: "#3a3950",
        accent: "#8b7cff",
        accentSoft: "rgba(139,124,255,.16)",
        primary: "#e9e8f0",
        primaryFg: "#16151c",
        stale: "#f5b544",
        radius: "10px",
        radiusSm: "8px",
        shadow: "0 1px 0 rgba(255,255,255,.03), 0 8px 24px rgba(0,0,0,.35)",
        shadowHover: "0 1px 0 rgba(255,255,255,.04), 0 12px 32px rgba(0,0,0,.45)",
        hoverSurface: "rgba(255,255,255,.06)",
        iframeBg: "#16151c",
      },
      "'Inter', -apple-system, system-ui, sans-serif",
    ),
  },
  brutalist: {
    label: "Brutalist",
    css: sheet(
      {
        bg: "#fff",
        fg: "#000",
        muted: "#3a3a3a",
        surface: "#fff",
        chip: "#fff",
        border: "#000",
        ring: "#000",
        accent: "#ff3b00",
        accentSoft: "rgba(255,59,0,.12)",
        primary: "#000",
        primaryFg: "#fff",
        stale: "#ff3b00",
        radius: "0",
        radiusSm: "0",
        shadow: "4px 4px 0 #000",
        shadowHover: "6px 6px 0 #000",
        hoverSurface: "rgba(0,0,0,.06)",
        iframeBg: "#fff",
      },
      "'Archivo', -apple-system, system-ui, sans-serif",
      `.card, .version-item, .badge, .empty, .btn, .bar, .subbar { border-width: 2px; }
    h1, .card-title, .card-title a, .crumb.title, .state { text-transform: uppercase; font-weight: 800; letter-spacing: -.01em; }`,
    ),
  },
  vercel: {
    label: "Vercel",
    css: sheet(
      {
        bg: "#000",
        fg: "#fff",
        muted: "#888",
        surface: "#0a0a0a",
        chip: "#111",
        border: "#333",
        ring: "#666",
        accent: "#fff",
        accentSoft: "rgba(255,255,255,.12)",
        primary: "#fff",
        primaryFg: "#000",
        stale: "#f5a623",
        radius: "8px",
        radiusSm: "7px",
        shadow: "none",
        shadowHover: "0 8px 24px rgba(0,0,0,.6)",
        hoverSurface: "rgba(255,255,255,.08)",
        iframeBg: "#000",
      },
      "'Inter', -apple-system, system-ui, sans-serif",
    ),
  },
  warm: {
    label: "Warm",
    css: sheet(
      {
        bg: "#fff7f2",
        fg: "#3a2e28",
        muted: "#806a58",
        surface: "#fffdfb",
        chip: "#fdeee6",
        border: "#f2e2d6",
        ring: "#edb9a3",
        accent: "#e8623d",
        accentSoft: "rgba(232,98,61,.12)",
        primary: "#3a2e28",
        primaryFg: "#fffdfb",
        stale: "#d97706",
        radius: "16px",
        radiusSm: "12px",
        shadow: "0 6px 18px rgba(232,98,61,.08)",
        shadowHover: "0 10px 28px rgba(232,98,61,.14)",
        hoverSurface: "rgba(58,46,40,.05)",
        iframeBg: "#fffdfb",
      },
      "'DM Sans', -apple-system, system-ui, sans-serif",
    ),
  },
  glass: {
    label: "Glass",
    css: sheet(
      {
        bg: "linear-gradient(135deg, #eef2ff 0%, #fce7f3 55%, #e0f7ff 100%)",
        fg: "#2e2a3f",
        muted: "#7d7898",
        surface: "rgba(255,255,255,.55)",
        chip: "rgba(255,255,255,.5)",
        border: "rgba(255,255,255,.7)",
        ring: "rgba(255,255,255,.95)",
        accent: "#7c6cff",
        accentSoft: "rgba(124,108,255,.14)",
        primary: "#2e2a3f",
        primaryFg: "#fff",
        stale: "#e0932a",
        radius: "18px",
        radiusSm: "15px",
        shadow: "0 8px 30px rgba(124,108,255,.12)",
        shadowHover: "0 12px 38px rgba(124,108,255,.2)",
        hoverSurface: "rgba(255,255,255,.4)",
        iframeBg: "#eef2ff",
      },
      "'DM Sans', -apple-system, system-ui, sans-serif",
      `.card, .version-item, .bar, .subbar { backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }`,
    ),
  },
};

export const themeNames = Object.keys(THEMES);
export const defaultTheme = "zinc";

// config.theme is boot-validated against themeNames, so the lookup always hits;
// the default fallback keeps this total for the type checker without an assertion.
export function themeCss(name: string): string {
  return (THEMES[name] ?? THEMES[defaultTheme])?.css ?? "";
}
