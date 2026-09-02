# Composed skills, distilled

Minimal fallback for when the full skills named in `SKILL.md` are not installed.
Prefer the real skills; this captures only the essentials `html-plan` relies on.
Full versions live in Milad's skill library and the `pstack` plugin.

## Research report (html-research-reports)

- One self-contained `.html` file. No build step, no external assets that break
  when the file moves. Inline the CSS; inline or data-URI any images.
- Open with a TL;DR box: the three to six things a first-screen reader needs.
- Numbered, navigable sections with a sticky table of contents.
- Per-section **Sources** footers, not one list at the bottom.
- Pick a deliberate aesthetic with theme tokens in `:root`, not the generic
  AI-generated look.

## Diagrams (html-architecture-diagrams, html-svg-diagrams)

- Draw connection and data-flow pictures as inline SVG with a legend.
- Never fake a diagram with flexbox boxes and arrow characters.
- Label nodes and edges; convey state by shape or label, not color alone.

## Writing (unslop, technical-writing)

- No em dashes. Use commas, periods, or parentheses.
- Plain words over fancy ones. One thought per sentence.
- Sentence-case headings that carry the point, not label-only headings.
- Use real symbol, file, and line names, not descriptions of them.
- No AI throat-clearing ("Perfect", "Great", "Certainly"). Have a view.

## Secret-hygiene grep gate

Before sharing any generated HTML, grep it for credential-shaped strings and
confirm the output is empty (or every hit is a deliberate placeholder):

```sh
grep -nEi '(api[_-]?key|secret|token|password|passwd|bearer|authorization|aws_(access|secret)|BEGIN [A-Z ]*PRIVATE KEY|xox[baprs]-|gh[pousr]_[A-Za-z0-9]{20,})' <file>.html
```

Redact anything real before the file leaves your machine.
