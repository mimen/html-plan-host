# Plan document theme

One theme, **Margin**. Paste the font link, the CSS, and build the page on the
markup skeleton below. The CSS owns the layout: sidebar contents on the left,
prose in the middle column, per-section sources pulled into the right margin.

It follows the OS. Light tokens live on `:root`, dark tokens in
`@media (prefers-color-scheme: dark)`. Do not hard-code a page-level dark
background. Print uses the light tokens.

## Density

Tight vertical rhythm, modest section spacing, compact lists and tables, body
line-height ~1.55. Prose column is 66ch. No hero whitespace.

## Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## CSS

```css
:root {
  color-scheme: light dark;
  --bg: #fdfdfb;
  --text: #17191a;
  --muted: #5a5f5c;
  --faint: #e3e6e2;
  --num: #d7ddd6;
  --accent: #1f5c3c;
  --mark: #d4f26b;
  --panel: #f1f4ef;
  --good: #1f5c3c;
  --amber: #8a5a00;
  --bad: #b42318;
  --font: Manrope, ui-sans-serif, system-ui, sans-serif;
  --display: "Instrument Serif", Georgia, serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1b1d1b;
    --text: #d6dbd3;
    --muted: #949c95;
    --faint: #2e332f;
    --num: #5f6a61;
    --accent: #8cc4a0;
    --mark: #9fbf3a;
    --panel: #222623;
    --good: #8cc4a0;
    --amber: #e0bd58;
    --bad: #e89a94;
  }
}
@media print {
  :root {
    --bg: #ffffff;
    --text: #17191a;
    --muted: #5a5f5c;
    --faint: #e3e6e2;
    --num: #d7ddd6;
    --accent: #1f5c3c;
    --mark: #d4f26b;
    --panel: #f1f4ef;
  }
}
html { color-scheme: light dark; scroll-padding-top: 24px; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.55 var(--font); }
a { color: var(--accent); }
code { font: 0.86em var(--mono); }
pre { background: var(--panel); padding: 12px 14px; overflow-x: auto; font: 13px/1.5 var(--mono); }
pre code { font: inherit; }
blockquote { margin: 0 0 12px; padding: 4px 0 4px 14px; border-left: 2px solid var(--mark); color: var(--muted); }
blockquote cite { display: block; margin-top: 4px; font-size: 13px; font-style: normal; }

.page { display: grid; grid-template-columns: 190px minmax(0, 66ch) 210px; gap: 0 40px; max-width: 1220px; margin: 0 auto; padding: 40px 40px 120px; }

nav { grid-column: 1; grid-row: 1 / span 60; position: sticky; top: 32px; align-self: start; display: flex; flex-direction: column; gap: 2px; padding-top: 6px; }
nav a { display: grid; grid-template-columns: 18px 1fr; gap: 6px; padding: 5px 0; font-size: 13px; font-weight: 600; text-decoration: none; color: var(--muted); line-height: 1.3; border-top: 1px solid var(--faint); }
nav a:first-child { border-top: 0; }
nav a:hover { color: var(--text); }
nav a.current { color: var(--text); }
nav a.current .num { color: var(--text); background: var(--mark); margin-left: -4px; padding: 0 4px; border-radius: 2px; }
nav .num { font: 500 11px var(--mono); color: var(--accent); }

.head { grid-column: 2 / 4; grid-row: 1; margin-bottom: 40px; }
.status { display: inline-block; margin: 0 0 16px; padding: 3px 10px; background: var(--mark); color: #17191a; font: 600 12px/1.6 var(--font); }
h1 { font: 400 76px/0.95 var(--display); letter-spacing: -0.01em; margin: 0 0 18px; }
.meta { margin: 0; font-size: 13px; color: var(--muted); display: grid; gap: 2px; }
.meta div { display: grid; grid-template-columns: 70px 1fr; }
.meta dt { font-weight: 600; }
.meta dd { margin: 0; }

section { display: grid; grid-template-columns: subgrid; grid-column: 1 / 4; padding: 0 0 36px; }
section > * { grid-column: 2; }
section h2 { display: flex; align-items: baseline; gap: 14px; margin: 0 0 12px; font: 400 36px/1.05 var(--display); }
section h2 .n { font: italic 400 56px/0.8 var(--display); color: var(--num); position: relative; top: 4px; }
h3 { font: 600 15px/1.3 var(--font); margin: 20px 0 6px; }

.tldr { background: var(--panel); padding: 24px 28px; margin: 0 0 40px; grid-column: 2 / 4; display: block; }
.tldr h2 { display: block; font: italic 400 34px/1 var(--display); margin: 0 0 12px; }
.tldr ol { margin: 0; padding-left: 1.3em; font-weight: 500; }
.tldr li { margin: 0 0 6px; }

section p { margin: 0 0 12px; }
section ul, section ol { margin: 0 0 12px; padding-left: 1.3em; }
section li { margin: 0 0 4px; }

table { border-collapse: collapse; width: 100%; margin: 4px 0 14px; font-size: 14px; }
th { text-align: left; font-weight: 700; padding: 6px 10px 6px 0; border-bottom: 1px solid var(--text); }
td { padding: 7px 10px 7px 0; border-bottom: 1px solid var(--faint); vertical-align: top; }

.sources { grid-column: 3; grid-row: 2 / span 40; align-self: start; font-size: 12px; line-height: 1.5; color: var(--muted); padding-left: 14px; border-left: 2px solid var(--mark); }

.diagram { margin: 4px 0 12px; }
.diagram svg { width: 100%; height: auto; display: block; font-family: var(--font); font-size: 13px; }
.diagram text { fill: var(--text); }
.diagram .lbl { fill: var(--muted); font-size: 11px; }
.diagram .box rect { fill: var(--panel); stroke: var(--faint); }
.diagram .lane rect { fill: var(--bg); stroke: var(--accent); stroke-width: 1.5; }
.diagram .hot rect { fill: var(--mark); }
.diagram .hot text { fill: #17191a; }

.diagram .edge path { fill: none; stroke: var(--muted); stroke-width: 1.5; }
.diagram .edge.dashed path { stroke-dasharray: 5 4; }
.diagram .arrow { fill: var(--muted); }
.diagram .life line { stroke: var(--faint); stroke-width: 1.5; }
.diagram .msg path { fill: none; stroke: var(--text); stroke-width: 1.5; }
.diagram .ent rect { fill: var(--bg); stroke: var(--faint); }
.diagram .ent .hd { fill: var(--panel); stroke: none; }
.diagram .ename { font-weight: 600; }
.diagram .fld { font: 12px var(--mono); }
.diagram .fld .key { text-decoration: underline; }
.diagram .fld .new { fill: var(--accent); font-weight: 600; }
.diagram .rel path { fill: none; stroke: var(--muted); stroke-width: 1.5; }
.diagram .grid line, .diagram .axis line { stroke: var(--faint); }
.diagram .bar text { font-size: 12px; }
.diagram .bars.mini rect, .diagram .legend .mini { fill: var(--accent); }
.diagram .bars.heroku rect, .diagram .legend .heroku { fill: var(--mark); }

.state { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
.state.good { background: var(--good); }
.state.amber { background: var(--amber); }
.state.bad { background: var(--bad); }
.tag { display: inline-block; padding: 1px 7px; margin-left: 6px; font-size: 11px; font-weight: 600; border: 1px solid currentColor; border-radius: 999px; vertical-align: middle; }
.tag.good { color: var(--good); }
.tag.amber { color: var(--amber); }
.tag.bad { color: var(--bad); }

.callout { padding: 12px 16px; margin: 0 0 14px; background: var(--panel); border-left: 3px solid var(--accent); font-size: 15px; }
.callout.warn { border-left-color: var(--amber); }
.callout strong { font-weight: 700; }

.matrix td, .risks td { font-size: 13.5px; }
.matrix .pick td { font-weight: 600; border-bottom: 2px solid var(--text); }
td.num { font-family: var(--mono); font-size: 12px; text-align: right; white-space: nowrap; }

.defs { margin: 0 0 12px; }
.defs dt { font-weight: 600; margin-top: 8px; }
.defs dd { margin: 2px 0 0; }

.timeline { list-style: none; padding: 0 0 0 20px; margin: 0 0 16px; border-left: 2px solid var(--faint); }
.timeline li { position: relative; padding: 0 0 18px; }
.timeline li::before { content: ""; position: absolute; left: -26px; top: 6px; width: 10px; height: 10px; border-radius: 50%; background: var(--bg); border: 2px solid var(--accent); }
.timeline .when { display: block; font: 500 11px var(--mono); color: var(--muted); margin-bottom: 2px; }
.timeline strong { display: block; font-weight: 700; }
.timeline p { margin: 4px 0 6px; }

.decisions li { margin: 0 0 8px; }
.decisions s { color: var(--muted); }

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 0 0 14px; }
.stat { padding: 12px 14px; background: var(--panel); }
.stat .v { display: block; font: 400 34px/1 var(--display); }
.stat .k { display: block; margin-top: 4px; font-size: 12px; color: var(--muted); }

.checklist { list-style: none; padding: 0; margin: 0 0 12px; }
.checklist li { position: relative; padding: 5px 0 5px 26px; border-top: 1px solid var(--faint); }
.checklist li::before { content: ""; position: absolute; left: 0; top: 9px; width: 14px; height: 14px; border: 1.5px solid var(--muted); border-radius: 3px; }
.checklist li.done { color: var(--muted); }
.checklist li.done::before { background: var(--accent); border-color: var(--accent); }
.checklist li.done::after { content: ""; position: absolute; left: 4px; top: 11px; width: 6px; height: 3px; border-left: 2px solid var(--bg); border-bottom: 2px solid var(--bg); transform: rotate(-45deg); }

details { margin: 0 0 12px; padding: 10px 14px; border: 1px solid var(--faint); }
details summary { cursor: pointer; font-weight: 600; }
details p { margin: 10px 0 0; }
kbd { font: 12px var(--mono); padding: 1px 5px; border: 1px solid var(--faint); border-bottom-width: 2px; border-radius: 3px; }

footer { grid-column: 2 / 4; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--faint); font-size: 13px; color: var(--muted); }

@media (max-width: 960px) {
  .page { grid-template-columns: minmax(0, 1fr); padding: 24px 20px 80px; }
  nav { grid-row: auto; position: static; flex-direction: row; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }
  nav a { display: inline-flex; gap: 6px; padding: 5px 10px; border: 1px solid var(--faint); border-radius: 999px; }
  .head, .tldr, section, footer { grid-column: 1; }
  section { display: block; }
  .sources { grid-row: auto; margin: 8px 0 0; padding: 10px 0 0; border-left: 0; border-top: 1px dashed var(--faint); }
  h1 { font-size: 48px; }
}
```

## Markup skeleton

```html
<body>
<div class="page">
<nav aria-label="Contents">
  <a href="#tldr"><span class="num">0</span><span>Short version</span></a>
  <a href="#goal"><span class="num">1</span><span>Goal</span></a>
</nav>

<header class="head">
  <p class="status">Awaiting implementation authorization</p>
  <h1>Title</h1>
  <dl class="meta">
    <div><dt>Artifact</dt><dd><code>path/to/this.html</code></dd></div>
    <div><dt>Updated</dt><dd>2026-09-10</dd></div>
  </dl>
</header>

<section class="tldr" id="tldr">
  <h2>Short version</h2>
  <ol><li>…</li></ol>
</section>

<section id="goal">
  <h2><span class="n">1</span>Goal</h2>
  <p>…</p>
  <h3>Phase A. Subheading</h3>
  <ol><li>…</li></ol>
  <aside class="sources">Sources: <a href="…">repo</a>; <a href="…">PR</a>.</aside>
</section>

<footer>Last updated 2026-09-10. Sources: …</footer>
</div>
<script>
const links = [...document.querySelectorAll("nav a[href^='#']")];
const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
const ids = [...byId.keys()];
const visible = new Set();
function mark() {
  const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  const current = atEnd ? ids[ids.length - 1] : ids.find((id) => visible.has(id));
  for (const [id, a] of byId) a.classList.toggle("current", id === current);
}
const observer = new IntersectionObserver((entries) => {
  for (const e of entries) e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id);
  mark();
}, { rootMargin: "-10% 0px -60% 0px" });
for (const id of ids) { const el = document.getElementById(id); if (el) observer.observe(el); }
addEventListener("scroll", mark, { passive: true });
</script>
</body>
```

Rules the CSS assumes:

- Keep the `<script>` at the end of `body`. It marks the contents link for the
  section in view with `.current`. Every `nav` href must match a section `id`.
- One `<aside class="sources">` per section, placed last inside the section. It
  lands in the right margin beside that section's first lines.
- `h2` carries `<span class="n">N</span>` for the section number. The short
  version `h2` has no number.
- Diagrams are inline SVG inside `<figure class="diagram">`. Group shapes as
  `<g class="box">` (neutral), `<g class="lane">` (outlined accent), or
  `<g class="hot">` (filled mark). Use `class="lbl"` on secondary text. Do not
  hard-code fills.
- State is a shape plus a label: `<span class="state good"></span>Passing`, or
  a pill: `<span class="tag amber">pending</span>`.
- Sequence diagrams: `<g class="life">` for lifelines, `<g class="msg">` for
  arrows, one shared `<marker id="arr">` per page. Entity diagrams:
  `<g class="ent">` with a `.hd` header rect, `.fld` rows, `.key` for primary
  keys, `.new` for columns this plan adds. Bar charts: `<g class="bars mini">`
  and `<g class="bars heroku">` are the two series colors; rename the classes
  to the series in hand and keep the two fills.

Components the CSS already styles, use them before inventing new ones:

| Class | For |
| --- | --- |
| `.callout`, `.callout.warn` | A note or a correction the reader must not skip. |
| `table.matrix` with `tr.pick` | Options comparison; the picked column's verdict row. |
| `table.risks` | Risk, likelihood, impact, mitigation. |
| `dl.defs` | Term definitions. |
| `ol.timeline` with `.when` and `.tag` | Phases with dates and reversibility. |
| `ol.decisions` | Locked decisions; `<s>` for rejected. |
| `.stats` of `.stat` | Three to five headline numbers. |
| `ul.checklist` with `li.done` | Progress record. |
| `details` | Rationale the first read can skip. |
| `blockquote` with `cite` | Attributed quote. |
| `pre code`, `kbd` | Code and key presses. |

## Variant: top contents

When the page has four or fewer sections, the contents can run across the top
as pills instead of down the side. Replace the `nav` rules with:

```css
nav { position: sticky; top: 0; z-index: 2; display: flex; gap: 6px; padding: 12px 40px; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--faint); overflow-x: auto; }
nav a { display: inline-flex; align-items: baseline; gap: 6px; padding: 5px 10px; border: 1px solid var(--faint); border-radius: 999px; font-size: 13px; font-weight: 600; text-decoration: none; color: var(--text); white-space: nowrap; }
nav .num { font: 500 11px var(--mono); color: var(--accent); }
.page { grid-template-columns: 120px minmax(0, 66ch) 220px; gap: 0 36px; max-width: 1180px; }
.head { grid-column: 2 / 4; }
section h2 { grid-column: 1 / 3; display: grid; grid-template-columns: subgrid; align-items: baseline; }
section h2 .n { grid-column: 1; font-size: 96px; justify-self: end; padding-right: 8px; top: 0; }
```

and move `<nav>` outside `.page`, directly under `<body>`.
