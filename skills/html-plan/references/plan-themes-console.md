# Plan document theme — Console

One of three plan themes, **Console**. A denser, product/engineering-doc look:
a sticky **numbered contents rail** on the left, a wide single content column,
an **at-a-glance stat strip** under the title, and card-style `.panel` and
`.callout` blocks. Where **Margin** is editorial (serif display, sources in the
right margin), Console is utilitarian — good for implementation plans, rollout
briefs, audits, and status docs that lean on tables, config blocks, and
diagrams more than long prose.

**Nocturne** ([`plan-themes-nocturne.md`](plan-themes-nocturne.md)) is the house
default theme. Take it unless the document wants something else. Pick **Margin**
([`plan-themes.md`](plan-themes.md)) for a reading-first writeup with sources in
the right margin. Pick **Console** for a decision or plan doc carried by a stat
strip, config blocks, and comparison tables under a scannable section rail.
Build each document on exactly one theme. Don't mix their class systems.

It follows the OS. Light tokens live on `:root`, dark tokens in
`@media (prefers-color-scheme: dark)`. Do not hard-code a page-level dark
background. Print falls back to the light tokens.

## Density

Comfortable, card-based rhythm: 16px body at line-height ~1.62, ~44px between
sections, panels and callouts with real padding. Wider than Margin — the content
column runs to ~1040px inside a 236px rail. Use the stat strip and panels to
break up walls of text.

## Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## CSS

```css
:root {
  color-scheme: light dark;
  --bg: #f5f6f9;
  --panel: #ffffff;
  --panel-2: #fbfbfd;
  --ink: #191b21;
  --ink-soft: #474c59;
  --ink-faint: #767c8a;
  --line: #e4e7ec;
  --line-strong: #cdd2db;
  --accent: #6b4fbb;
  --accent-ink: #4a338f;
  --accent-wash: #efeafb;
  --accent-wash-2: #f6f3fd;
  --ok: #1f8a53; --ok-wash: #e6f4ec;
  --warn: #b26a00; --warn-wash: #fbefdc;
  --danger: #c0392b; --danger-wash: #fbe9e7;
  --code-bg: #16181d; --code-ink: #e7e9ee;
  --radius: 12px; --radius-sm: 8px;
  --shadow: 0 1px 2px rgba(20,22,34,.05), 0 8px 24px -14px rgba(20,22,34,.16);
  --mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --sans: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
  --display: "Space Grotesk", var(--sans);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #131419; --panel: #1c1e25; --panel-2: #191b21; --ink: #eaecf1; --ink-soft: #b6bcc9;
    --ink-faint: #868d9c; --line: #292c34; --line-strong: #3a3e49; --accent: #a894e6;
    --accent-ink: #cabff3; --accent-wash: #262138; --accent-wash-2: #201d2e;
    --ok: #5fce93; --ok-wash: #16281f; --warn: #e5a44e; --warn-wash: #2c2312;
    --danger: #e88b7f; --danger-wash: #2c1815; --code-bg: #0e0f13; --code-ink: #e7e9ee;
    --shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 30px -16px rgba(0,0,0,.7);
  }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--sans); line-height: 1.62; font-size: 16px; -webkit-font-smoothing: antialiased; }

/* Hero */
header.hero { border-bottom: 1px solid var(--line); background: radial-gradient(120% 140% at 0% 0%, var(--accent-wash) 0%, transparent 55%); }
.hero-inner { max-width: 1240px; margin: 0 auto; padding: 46px 32px 34px; }
.brandline { display: flex; align-items: center; gap: 10px; margin: 0 0 16px; }
.glyph { width: 26px; height: 26px; display: block; }
.kicker { font-family: var(--mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--accent-ink); margin: 0; }
h1 { font-family: var(--display); font-weight: 700; font-size: clamp(29px, 4.4vw, 46px); line-height: 1.06; margin: 0 0 14px; letter-spacing: -.022em; max-width: 20ch; }
.lede { font-size: 18px; color: var(--ink-soft); max-width: 70ch; margin: 0; }
.meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; font-family: var(--mono); font-size: 12px; }
.pill { border: 1px solid var(--line-strong); border-radius: 999px; padding: 5px 12px; color: var(--ink-soft); background: var(--panel); }
.pill b { color: var(--ink); font-weight: 600; }

/* Shell: sticky rail + content */
.shell { max-width: 1240px; margin: 0 auto; padding: 0 32px 100px; display: grid; grid-template-columns: 236px 1fr; gap: 48px; align-items: start; }
nav.rail { position: sticky; top: 24px; align-self: start; padding-top: 34px; }
nav.rail .rail-h { font-family: var(--mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-faint); margin: 0 0 12px 12px; }
nav.rail a { display: flex; gap: 10px; align-items: baseline; text-decoration: none; color: var(--ink-faint); font-size: 13.5px; padding: 6px 12px; border-left: 2px solid transparent; border-radius: 0 6px 6px 0; transition: .12s; }
nav.rail a .rn { font-family: var(--mono); font-size: 11px; color: var(--line-strong); }
nav.rail a:hover { color: var(--ink); background: var(--accent-wash-2); }
nav.rail a.current { color: var(--accent-ink); border-left-color: var(--accent); background: var(--accent-wash); font-weight: 600; }
nav.rail a.current .rn { color: var(--accent); }
.rail-foot { margin: 20px 0 0 12px; font-family: var(--mono); font-size: 10.5px; color: var(--ink-faint); line-height: 1.5; }
main { min-width: 0; padding-top: 8px; }

/* At-a-glance stat strip */
.glance { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 26px 0 8px; }
.stat { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 14px 16px; box-shadow: var(--shadow); }
.stat .n { font-family: var(--display); font-size: 22px; font-weight: 700; color: var(--accent-ink); line-height: 1; }
.stat .l { font-family: var(--mono); font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-faint); margin-top: 8px; }

/* Sections */
section { margin-top: 46px; scroll-margin-top: 24px; }
h2 { font-family: var(--display); font-size: 25px; font-weight: 600; letter-spacing: -.012em; margin: 0 0 6px; display: flex; align-items: center; gap: 13px; }
h2 .num { font-family: var(--mono); font-size: 12px; font-weight: 500; color: var(--accent-ink); background: var(--accent-wash); border: 1px solid var(--line); width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; }
h3 { font-family: var(--display); font-size: 17px; font-weight: 600; margin: 26px 0 8px; }
.sub { color: var(--ink-faint); margin: 0 0 18px; font-size: 15px; }
p { margin: 0 0 14px; } a { color: var(--accent-ink); }

.panel { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px 22px; margin: 16px 0; box-shadow: var(--shadow); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.callout { border-left: 3px solid var(--accent); background: var(--accent-wash); border-radius: 0 var(--radius) var(--radius) 0; padding: 14px 18px; margin: 16px 0; }
.callout.warn { border-left-color: var(--warn); background: var(--warn-wash); }
.callout.ok { border-left-color: var(--ok); background: var(--ok-wash); }
.callout .lbl { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint); display: block; margin-bottom: 4px; }

/* Per-section sources footer: last thing inside every numbered section */
.sources { margin-top: 24px; padding-top: 11px; border-top: 1px solid var(--line); font-family: var(--mono); font-size: 11.5px; line-height: 1.7; color: var(--ink-faint); }
.sources .lbl { letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint); margin-right: 9px; }
.sources a { color: var(--ink-soft); }
.sources a:hover { color: var(--accent-ink); }
.sources .sep { color: var(--line-strong); margin: 0 7px; }

ul, ol { margin: 0 0 14px; padding-left: 22px; } li { margin: 5px 0; } li::marker { color: var(--accent); }

/* Definition list: mono term column, prose column */
.defs { display: grid; grid-template-columns: 172px 1fr; gap: 10px 16px; margin: 16px 0; }
.defs dt { font-family: var(--mono); font-size: 12.5px; color: var(--accent-ink); padding-top: 2px; }
.defs dd { margin: 0; font-size: 15px; color: var(--ink-soft); }

table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 14px; }
th, td { text-align: left; padding: 9px 11px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-family: var(--mono); font-size: 11.5px; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line-strong); }
tbody tr:hover { background: var(--accent-wash-2); }
/* Options comparison; .pick marks the chosen row (cell tints paint over the row hover) */
table.matrix td { font-size: 13.5px; }
table.matrix tr.pick td { background: var(--accent-wash); color: var(--ink); font-weight: 600; border-bottom-color: var(--line-strong); }
table.matrix tr.pick td:first-child { box-shadow: inset 2px 0 0 var(--accent); }
td code, p code, li code { font-family: var(--mono); font-size: 12.5px; background: var(--line); padding: 1px 5px; border-radius: 4px; }

.tag { font-family: var(--mono); font-size: 11px; padding: 2px 7px; border-radius: 5px; white-space: nowrap; display: inline-block; }
.tag.ok { background: var(--ok-wash); color: var(--ok); }
.tag.warn { background: var(--warn-wash); color: var(--warn); }
.tag.accent { background: var(--accent-wash); color: var(--accent-ink); }
.tag.danger { background: var(--danger-wash); color: var(--danger); font-weight: 600; }

pre { background: var(--code-bg); color: var(--code-ink); border-radius: var(--radius); padding: 16px 18px; overflow-x: auto; font-family: var(--mono); font-size: 13px; line-height: 1.55; margin: 14px 0; border: 1px solid var(--line-strong); }
pre .c { color: #8b93a7; } pre .k { color: #c8b6ff; } pre .v { color: #7fd6a3; }

/* Phase list (rollouts/timelines) */
.phase { display: grid; grid-template-columns: 96px 1fr; gap: 0; }
.phase + .phase { border-top: 1px solid var(--line); }
.phase .p-when { font-family: var(--mono); font-size: 12px; color: var(--accent-ink); padding: 16px 12px 16px 0; font-weight: 500; }
.phase .p-body { padding: 16px 0; }
.phase .p-body h4 { margin: 0 0 6px; font-family: var(--display); font-size: 16px; }

/* Diagrams: inline SVG, themed via currentColor + tokens (never hard-code fills) */
.diagram { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 10px; overflow-x: auto; box-shadow: var(--shadow); }
svg text { font-family: var(--mono); fill: var(--ink-soft); }

footer { margin-top: 62px; padding-top: 20px; border-top: 1px solid var(--line); font-family: var(--mono); font-size: 12px; color: var(--ink-faint); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }

@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; gap: 0; }
  nav.rail { position: static; padding-top: 20px; display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid var(--line); padding-bottom: 16px; }
  nav.rail .rail-h, .rail-foot { display: none; }
  nav.rail a { border-left: none; border: 1px solid var(--line); border-radius: 999px; padding: 4px 10px; }
  nav.rail a.current { border-color: var(--accent); }
  .glance { grid-template-columns: 1fr 1fr; }
  .grid2 { grid-template-columns: 1fr; }
  .phase { grid-template-columns: 1fr; } .phase .p-when { padding-bottom: 0; }
  .defs { display: block; } .defs dt { margin-top: 12px; } .defs dd { margin: 2px 0 0; }
}
@media print {
  :root { --bg:#fff; --panel:#fff; --accent-wash:#f2eefb; --shadow: none; }
  body { font-size: 12px; } nav.rail, .meta-row { display: none; }
  .shell { grid-template-columns: 1fr; } pre { background: #f0f0f0; color: #111; } section { break-inside: avoid; }
}
```

## Markup skeleton

```html
<body>
<header class="hero">
  <div class="hero-inner">
    <div class="brandline">
      <svg class="glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="6" stroke="var(--accent)" stroke-width="1.6"/><path d="M7 12.4l3.1 3.1L17 8.5" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <p class="kicker">Kicker · Context</p>
    </div>
    <h1>Document title</h1>
    <p class="lede">One-sentence framing of what this is and isn't.</p>
    <div class="meta-row">
      <span class="pill"><b>Key</b> value</span>
      <span class="pill"><b>Key</b> value</span>
    </div>
  </div>
</header>

<div class="shell">
  <nav class="rail" aria-label="Contents">
    <p class="rail-h">Contents</p>
    <a href="#one"><span class="rn">01</span> First section</a>
    <a href="#two"><span class="rn">02</span> Second section</a>
    <p class="rail-foot">Owner · v1<br>updated 2026-01-01</p>
  </nav>

  <main>
    <div class="glance">
      <div class="stat"><div class="n">42</div><div class="l">Headline number</div></div>
      <div class="stat"><div class="n">3</div><div class="l">Another number</div></div>
      <div class="stat"><div class="n">~9</div><div class="l">Another number</div></div>
      <div class="stat"><div class="n">0</div><div class="l">Another number</div></div>
    </div>

    <section id="one">
      <h2><span class="num">01</span> First section</h2>
      <p class="sub">Optional one-line subtitle.</p>
      <p>Prose…</p>
      <div class="callout"><span class="lbl">Note</span> A note the reader must not skip.</div>
      <dl class="defs">
        <dt>term</dt><dd>What the term means in this document.</dd>
        <dt>other term</dt><dd>One line, no hedging.</dd>
      </dl>
      <aside class="sources"><span class="lbl">Sources</span><a href="#">repo</a><span class="sep">·</span><a href="#">PR</a></aside>
    </section>

    <section id="two">
      <h2><span class="num">02</span> Second section</h2>
      <table class="matrix">
        <thead><tr><th>Option</th><th>Cost</th><th>Verdict</th></tr></thead>
        <tbody>
          <tr class="pick"><td>Option A</td><td>Low</td><td><span class="tag accent">Picked</span></td></tr>
          <tr><td>Option B</td><td>High</td><td><span class="tag warn">rejected</span></td></tr>
        </tbody>
      </table>
      <aside class="sources"><span class="lbl">Sources</span><a href="#">benchmark</a><span class="sep">·</span><a href="#">vendor docs</a></aside>
    </section>

    <footer>
      <span>Doc name</span>
      <span>Last updated 2026-01-01 · draft</span>
    </footer>
  </main>
</div>

<script>
  // Scroll-spy: highlight the rail link for the section in view. classList only — no innerHTML.
  (function () {
    var links = {};
    document.querySelectorAll('nav.rail a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          Object.values(links).forEach(function (a) { a.classList.remove('current'); });
          var active = links[e.target.id];
          if (active) active.classList.add('current');
        }
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    document.querySelectorAll('section[id]').forEach(function (s) { obs.observe(s); });
  })();
</script>
</body>
```

Rules the CSS assumes:

- Keep the `<script>` at the end of `body`. It marks the rail link for the
  section in view with `.current`. Every `nav.rail` href must match a `section` id.
- `h2` carries `<span class="num">N</span>` for the section number badge; keep
  the rail's `<span class="rn">N</span>` numbers in sync with them.
- Every numbered section ends with its own `<aside class="sources">`, placed
  last inside the section. Label it with `<span class="lbl">Sources</span>` and
  separate the links with `<span class="sep">·</span>`.
- The stat strip is optional but idiomatic: three to five `.stat` tiles of a
  headline number (`.n`) plus a short label (`.l`). Drop it for pure-prose docs.
- A comparison table is `<table class="matrix">`. Mark the chosen row
  `<tr class="pick">` and keep the word in its verdict cell
  (`<span class="tag accent">Picked</span>`), so the pick reads without the tint.
- Term definitions go in `<dl class="defs">`, one `dd` per `dt`. Keep terms short
  enough for the mono term column; the grid collapses to stacked rows on narrow
  screens.
- Diagrams are inline SVG inside `<div class="diagram">`. Theme shapes with
  `fill="var(--panel)"` / `stroke="var(--line-strong)"` / `var(--accent)` and
  `currentColor` for edges — never hard-code light/dark fills.
- Convey state by shape or label too, not color alone: pair a `.tag` with its
  word (`<span class="tag warn">pending</span>`), don't rely on the hue.

Components the CSS already styles — use them before inventing new ones:

| Class | For |
| --- | --- |
| `.panel`, `.grid2` | A card, or two side-by-side cards. |
| `.callout`, `.callout.ok`, `.callout.warn` | A note, a good-news status, or a warning the reader must not skip. |
| `aside.sources` with `.lbl` and `.sep` | Per-section source footer; every numbered section ends with one. |
| `.glance` of `.stat` | Three to five headline numbers under the title. |
| `.tag` + `.ok`/`.warn`/`.accent`/`.danger` | Inline status/label pill. |
| `table.matrix` with `tr.pick` | Options comparison; the chosen row. |
| `dl.defs` | Term definitions in a mono term column. |
| `.phase` rows | A phased rollout or timeline (when-label + body). |
| `pre` with `.c`/`.k`/`.v` spans | Config/code blocks with comment/key/value tinting. |
| `.pill` in `.meta-row` | Key/value chips in the hero. |
| `.diagram` + inline SVG | Architecture, flow, or sequence pictures. |
