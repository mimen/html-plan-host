# Plan document theme — Nocturne

The third plan theme, **Nocturne**. A technical-reference look built for
dense, deeply-cited docs: a compact left contents rail, a numbered `.steps`
ladder, semantic `.note` callouts, per-section `.cites` footers, attributed
quotes, and a tokenized inline-SVG diagram system. Space Grotesk display over
a system body, JetBrains Mono, a blue accent. It reads like an engineering
runbook or a system reference.

Pick **Margin** for an editorial writeup with sources in the right margin;
**Console** for a decision/plan doc with a stat strip and card panels;
**Nocturne** for a reference or deep-dive with steps, notes, and heavy inline
citation. Build each document on exactly one theme.

Nocturne was designed dark, but it **follows the OS** like the others: the dark
palette lives in `@media (prefers-color-scheme: dark)`, a light palette on
`:root`, and print uses the light tokens. Component tints (notes, tags, diagram
nodes) are `color-mix` of the semantic tokens, so they adapt to both modes
instead of being hard-coded for dark.

## Density

Reference-dense: 15px body at line-height ~1.62, ~56px between sections, compact
tables and a mono-numbered step ladder. Content column runs to ~1180px inside a
210px rail. Lean on `.note`, `.steps`, and per-section `.cites` to structure
long material.

## Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## CSS

```css
:root {
  color-scheme: light dark;
  --bg: #fbfcfe; --panel: #ffffff; --panel2: #f2f4f8; --border: #e2e6ee;
  --text: #161a21; --prose: #2c313b; --muted: #586274; --faint: #8994a5;
  --accent: #3a57d6; --good: #137a53; --amber: #8a5a00; --bad: #c0392b;
  --code: #f3f5f9; --code-fg: #2c313b;
  --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --display: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --body: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  --r: 12px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0e1014; --panel: #161922; --panel2: #1b1f2a; --border: #282d39;
    --text: #e9ebf0; --prose: #d3d7e0; --muted: #98a1b2; --faint: #6c7688;
    --accent: #7c9cff; --good: #5ad1a8; --amber: #f2b84b; --bad: #ef6a6a;
    --code: #0a0c11; --code-fg: #cdd3df;
  }
}
@media print {
  :root {
    --bg: #fff; --panel: #fff; --panel2: #f2f4f8; --border: #e2e6ee;
    --text: #161a21; --prose: #2c313b; --muted: #586274; --faint: #8994a5;
    --code: #f3f5f9; --code-fg: #2c313b;
  }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--prose); font-family: var(--body); line-height: 1.62; font-size: 15px; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
code { font-family: var(--mono); font-size: .86em; background: var(--code); color: var(--code-fg); border: 1px solid var(--border); border-radius: 5px; padding: 1px 5px; }

/* layout */
.shell { max-width: 1180px; margin: 0 auto; padding: 40px 28px 100px; display: grid; grid-template-columns: 210px 1fr; gap: 44px; }
nav.toc { position: sticky; top: 28px; align-self: start; font-size: 13px; max-height: calc(100vh - 56px); overflow: auto; }
nav.toc .lbl { color: var(--faint); text-transform: uppercase; letter-spacing: .08em; font-size: 10.5px; margin: 0 0 10px; }
nav.toc a { display: block; color: var(--muted); padding: 4px 0 4px 12px; margin-left: -2px; border-left: 2px solid transparent; }
nav.toc a:hover { color: var(--text); text-decoration: none; border-left-color: var(--border); }
nav.toc a.current { color: var(--text); border-left-color: var(--accent); }
main { min-width: 0; }

header.top { margin-bottom: 34px; }
header.top .eyebrow { font-family: var(--mono); color: var(--accent); font-size: 12px; letter-spacing: .02em; margin: 0 0 10px; }
header.top h1 { font-family: var(--display); font-size: 32px; line-height: 1.15; margin: 0 0 10px; letter-spacing: -.02em; font-weight: 700; color: var(--text); }
header.top .framing { color: var(--muted); font-size: 16px; margin: 0; max-width: 70ch; }
header.top .stamp { color: var(--faint); font-size: 12.5px; margin: 14px 0 0; font-family: var(--mono); }

h2 { font-family: var(--display); font-size: 21px; letter-spacing: -.01em; margin: 0 0 4px; font-weight: 600; color: var(--text); scroll-margin-top: 24px; }
h3 { font-family: var(--display); font-size: 15.5px; margin: 26px 0 8px; font-weight: 600; color: var(--text); }
section { margin-bottom: 56px; }
section > .kicker { color: var(--faint); font-size: 12.5px; margin: 0 0 18px; }
p { margin: 0 0 13px; } strong { color: var(--text); }

/* TL;DR */
.tldr { background: linear-gradient(180deg, var(--panel), color-mix(in srgb, var(--panel) 84%, var(--bg))); border: 1px solid var(--border); border-radius: var(--r); padding: 22px 24px; margin-bottom: 48px; }
.tldr h2 { margin-bottom: 14px; font-size: 16px; color: var(--accent); }
.tldr ol { margin: 0; padding-left: 20px; } .tldr li { margin-bottom: 11px; } .tldr li:last-child { margin-bottom: 0; }
.tldr b { color: var(--text); }

/* callouts — color-mix keeps tints correct in light and dark */
.note { border-radius: 10px; padding: 12px 15px; margin: 14px 0; font-size: 14px; border: 1px solid var(--border); background: var(--panel); }
.note.good { border-color: color-mix(in srgb, var(--good) 45%, var(--border)); background: color-mix(in srgb, var(--good) 8%, var(--panel)); }
.note.warn { border-color: color-mix(in srgb, var(--amber) 45%, var(--border)); background: color-mix(in srgb, var(--amber) 8%, var(--panel)); }
.note.bad { border-color: color-mix(in srgb, var(--bad) 45%, var(--border)); background: color-mix(in srgb, var(--bad) 8%, var(--panel)); }
.note.info { border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); background: color-mix(in srgb, var(--accent) 8%, var(--panel)); }

/* quotes */
blockquote.q { margin: 16px 0; padding: 12px 16px; border-left: 3px solid var(--accent); background: var(--panel); border-radius: 0 8px 8px 0; }
blockquote.q p { margin: 0 0 6px; color: var(--text); font-size: 14.5px; }
blockquote.q .attr { margin: 0; font-size: 12.5px; color: var(--muted); }
blockquote.q .attr b { color: var(--text); font-weight: 600; }

/* tables */
table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin: 12px 0 4px; }
th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
th { color: var(--faint); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
tbody tr:last-child td { border-bottom: none; }
td code { white-space: nowrap; }

/* numbered step ladder; .manual for a human-only step */
.steps { list-style: none; counter-reset: step; padding: 0; margin: 14px 0 0; }
.steps > li { counter-increment: step; position: relative; padding: 0 0 4px 46px; margin-bottom: 16px; }
.steps > li::before { content: counter(step); position: absolute; left: 0; top: -2px; width: 30px; height: 30px; border-radius: 8px; background: var(--panel2); border: 1px solid var(--border); font-family: var(--mono); font-size: 13px; font-weight: 500; color: var(--accent); display: flex; align-items: center; justify-content: center; }
.steps > li.manual::before { color: var(--amber); border-color: color-mix(in srgb, var(--amber) 40%, var(--border)); }
.steps h4 { margin: 0 0 5px; font-size: 15px; font-family: var(--display); font-weight: 600; }
.steps p { margin: 0 0 7px; font-size: 14px; }
.tag { display: inline-block; font-family: var(--mono); font-size: 10.5px; padding: 1px 7px; border-radius: 20px; border: 1px solid var(--border); color: var(--muted); margin-right: 5px; }
.tag.m { color: var(--amber); border-color: color-mix(in srgb, var(--amber) 40%, var(--border)); }
.tag.c { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); }
.tag.a { color: var(--good); border-color: color-mix(in srgb, var(--good) 40%, var(--border)); }

/* per-section citations */
.cites { margin-top: 22px; padding-top: 12px; border-top: 1px dashed var(--border); font-size: 12px; color: var(--faint); }
.cites b { color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; font-size: 10.5px; margin-right: 8px; }
.cites a { color: var(--muted); } .cites a:hover { color: var(--accent); }
.cites .sep { color: var(--border); margin: 0 7px; }

/* diagram — tokenized node fills flip with the OS; never hard-code fills */
.diagram-wrap { background: var(--panel); border: 1px solid var(--border); border-radius: var(--r); padding: 8px; margin: 16px 0; overflow-x: auto; }
svg.arch { display: block; min-width: 760px; width: 100%; height: auto; font-family: var(--body); }
.arch .node div { font-size: 12.5px; line-height: 1.4; height: 100%; border-radius: 9px; padding: 9px 11px; overflow: hidden; }
.arch .node .nt { font-weight: 700; font-size: 13px; display: block; margin-bottom: 3px; color: var(--text); }
.arch .node .ns { color: var(--muted); font-size: 11.5px; }
.n-src div { background: color-mix(in srgb, var(--accent) 12%, var(--panel)); border: 1.5px solid var(--accent); }
.n-a div, .n-both div { background: color-mix(in srgb, var(--good) 12%, var(--panel)); border: 1.5px solid var(--good); }
.n-b div { background: color-mix(in srgb, var(--amber) 12%, var(--panel)); border: 1.5px solid var(--amber); }
.n-onlyb div { background: color-mix(in srgb, var(--bad) 12%, var(--panel)); border: 1.5px solid var(--bad); }
.arch .elabel { font-family: var(--mono); font-size: 10.5px; fill: var(--muted); }
.arch .elabel.bad { fill: var(--bad); }
.legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 6px; padding: 12px 14px; font-size: 12px; color: var(--muted); }
.legend span { display: inline-flex; align-items: center; gap: 7px; }
.legend .swatch { width: 22px; height: 0; border-top-width: 2px; border-top-style: solid; display: inline-block; }

/* code */
pre { background: var(--code); color: var(--code-fg); border: 1px solid var(--border); border-radius: var(--r); padding: 15px 17px; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.55; margin: 14px 0; }
pre code { background: none; border: none; padding: 0; font-size: inherit; color: inherit; }
ul.tight { margin: 8px 0 0; padding-left: 20px; } ul.tight li { margin-bottom: 7px; font-size: 14px; }

footer { color: var(--faint); font-size: 12.5px; border-top: 1px solid var(--border); padding-top: 18px; margin-top: 20px; }

@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; gap: 0; padding: 28px 20px 80px; }
  nav.toc { position: static; max-height: none; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
  nav.toc a { display: inline-block; margin-right: 10px; border-left: none; padding-left: 0; }
}
@media print {
  .shell { display: block; } nav.toc { display: none; }
  .note, .tldr, pre, table, .diagram-wrap { break-inside: avoid; }
}
```

## Markup skeleton

```html
<body>
<div class="shell">
  <nav class="toc" aria-label="Contents">
    <p class="lbl">Contents</p>
    <a href="#one">1. First section</a>
    <a href="#two">2. Second section</a>
  </nav>

  <main>
    <header class="top">
      <p class="eyebrow">Area · context</p>
      <h1>Document title</h1>
      <p class="framing">One-sentence framing of what this is and isn't.</p>
      <p class="stamp">Last updated 2026-01-01 · sources: repo, docs, Slack</p>
    </header>

    <div class="tldr">
      <h2>The short version</h2>
      <ol><li><b>Lead point.</b> …</li></ol>
    </div>

    <section id="one">
      <h2>1. First section</h2>
      <p class="kicker">Optional one-line framing.</p>
      <p>Prose…</p>
      <div class="note info"><strong>Note.</strong> A thing worth flagging.</div>
      <ol class="steps">
        <li><h4>Do the thing <span class="tag c">claude</span></h4><p>…</p></li>
        <li class="manual"><h4>Human step <span class="tag m">manual</span></h4><p>…</p></li>
      </ol>
      <aside class="cites"><b>Sources</b> <a href="#">repo</a> <span class="sep">·</span> <a href="#">PR</a></aside>
    </section>

    <footer>Last updated 2026-01-01. Sources: …</footer>
  </main>
</div>

<script>
  // Scroll-spy: mark the toc link for the section in view. classList only, no innerHTML.
  (function () {
    var links = {};
    document.querySelectorAll('nav.toc a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          Object.values(links).forEach(function (a) { a.classList.remove('current'); });
          var active = links[e.target.id];
          if (active) active.classList.add('current');
        }
      });
    }, { rootMargin: '-12% 0px -70% 0px' });
    document.querySelectorAll('section[id]').forEach(function (s) { obs.observe(s); });
  })();
</script>
</body>
```

Rules the CSS assumes:

- Keep the `<script>` at the end of `body`; it marks the `nav.toc` link for the
  section in view with `.current`. Every toc href must match a `section` id.
- One `<aside class="cites">` per section, placed last, for that section's
  sources. Separate links with `<span class="sep">·</span>`.
- The step ladder is `<ol class="steps">`; add `class="manual"` to a human-only
  step, and label each with a `.tag` (`.c` claude, `.a` agent, `.m` manual).
- Diagrams are inline SVG inside `<div class="diagram-wrap">`. Node bodies use
  `<foreignObject>` with a `<div>`, grouped `.n-src` / `.n-a` / `.n-b` /
  `.n-both` / `.n-onlyb`. Fills come from `color-mix` of the tokens, so they flip
  with the OS. Do not hard-code hex fills.
- Convey state by shape or label too, not color alone: pair a `.note`/`.tag`
  with its word.

Components the CSS already styles, use them before inventing new ones:

| Class | For |
| --- | --- |
| `.tldr` | The "short version" box at the top. |
| `.note` + `.good`/`.warn`/`.bad`/`.info` | Semantic callouts. |
| `ol.steps` with `.manual` and `.tag` | A numbered procedure with per-step actor tags. |
| `blockquote.q` with `.attr` | An attributed quote. |
| `aside.cites` | Per-section source footer (dashed rule). |
| `.diagram-wrap` + `svg.arch` | Architecture/flow diagram with tokenized nodes. |
| `pre`, `code` | Code and config blocks. |
| `.eyebrow`, `.framing`, `.stamp` | Header kicker, framing line, and timestamp. |
