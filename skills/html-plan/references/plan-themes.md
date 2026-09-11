# Plan document themes

Pick one theme. Paste its font `<link>` and CSS block into the page. Default is
**Spec**. Use **Reading** for long-form prose. Use **Carbon** for inventories
and tables. Use another only when asked.

Every theme follows the OS. Light tokens live on `:root`. Dark tokens live in
`@media (prefers-color-scheme: dark)`. Set `html { color-scheme: light dark; }`.
Do not hard-code a page-level dark background. Print uses the light tokens.

## Density (every theme)

Tight vertical rhythm, modest section spacing, compact cards and lists, body
line-height ~1.5. Cap prose at ~68-72ch. No hero whitespace.

## Spec (default)

Quiet spec. Inter body, IBM Plex Mono for code. No display face. Radius 8px.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

```css
:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --panel: #f4f6f8;
  --text: #121417;
  --muted: #3e4754;
  --border: #d0d7de;
  --accent: #0b57d0;
  --good: #0f7a3f;
  --amber: #8a5a00;
  --bad: #b42318;
  --radius: 8px;
  --font: Inter, ui-sans-serif, system-ui, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #12141a;
    --panel: #1c2028;
    --text: #f3f5f8;
    --muted: #c5ccd6;
    --border: #3a4250;
    --accent: #9cbcff;
    --good: #6ed9a8;
    --amber: #e8c05a;
    --bad: #f08080;
  }
}
@media print {
  :root {
    --bg: #ffffff;
    --panel: #f4f6f8;
    --text: #121417;
    --muted: #3e4754;
    --border: #d0d7de;
    --accent: #0b57d0;
  }
}
html { color-scheme: light dark; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 16px/1.55 var(--font);
}
```

## Reading

Source Serif 4 body, IBM Plex Mono for code. Radius 6px. Same shell as Spec.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,ital,wght@8..60,0,400;8..60,0,600;8..60,0,700;8..60,1,400&display=swap" rel="stylesheet">
```

```css
:root {
  color-scheme: light dark;
  --bg: #fbfaf7;
  --panel: #f3f0ea;
  --text: #1c1916;
  --muted: #5a544a;
  --border: #ddd6c8;
  --accent: #2f5d45;
  --good: #2f5d45;
  --amber: #8a5a00;
  --bad: #8f2d2d;
  --radius: 6px;
  --font: "Source Serif 4", Iowan Old Style, Georgia, serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1b1a17;
    --panel: #25231e;
    --text: #f4f0e6;
    --muted: #c2b9a8;
    --border: #3e3a32;
    --accent: #8fbfa3;
    --good: #8fbfa3;
    --amber: #e8c05a;
    --bad: #e09090;
  }
}
@media print {
  :root {
    --bg: #fbfaf7;
    --panel: #f3f0ea;
    --text: #1c1916;
    --muted: #5a544a;
    --border: #ddd6c8;
    --accent: #2f5d45;
  }
}
html { color-scheme: light dark; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 16px/1.55 var(--font);
}
```

## Carbon

IBM Plex Sans and IBM Plex Mono. Radius 0. Squared rules. Same shell as Spec.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

```css
:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --panel: #f4f4f4;
  --text: #161616;
  --muted: #393939;
  --border: #e0e0e0;
  --accent: #0f62fe;
  --good: #198038;
  --amber: #8e6a00;
  --bad: #da1e28;
  --radius: 0;
  --font: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #161616;
    --panel: #262626;
    --text: #f4f4f4;
    --muted: #c6c6c6;
    --border: #393939;
    --accent: #78a9ff;
    --good: #42be65;
    --amber: #f1c21b;
    --bad: #fa4d56;
  }
}
@media print {
  :root {
    --bg: #ffffff;
    --panel: #f4f4f4;
    --text: #161616;
    --muted: #393939;
    --border: #e0e0e0;
    --accent: #0f62fe;
  }
}
html { color-scheme: light dark; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 16px/1.55 var(--font);
}
```

## Shared shell

Use the tokens. Headings use `--font` at 600. Code uses `--mono`. State colors
go on bars, borders, and dots, not on body text. Sidebar, short-version box,
numbered `h2`s, and per-section sources stay. Compact padding. Measure ~70ch.
