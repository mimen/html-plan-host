---
name: html-plan
description: House style for a shareable HTML plan, reference, or deep-dive, one self-contained, heavily-cited HTML page a teammate opens once. Use for "html plan", "/html-plan", "write this up as an HTML doc", "make an html reference/deep-dive for X", or turning research and findings into one readable page. Composes writing and diagram skills, then publishes to a durable URL via html-plan-push.
metadata:
  author: milad
  version: "1.0.0"
---

# html-plan

Produce one self-contained HTML page that stands on its own as a research
report, reference, or plan. This skill is thin on purpose. It composes a few
capabilities and adds the house conventions that make the result readable and
citable, then publishes it to a durable URL.

## Reference skills

For each skill below, prefer the locally installed version and invoke it rather
than restating its rules. If it is not installed, read the vendored copy at
`references/<name>/SKILL.md` (verbatim, attributed in `references/NOTICE.md`).
Load them on demand, not up front. The publish step, **html-plan-push**, ships
in this plugin, see Deliver.

| Skill | When to use |
| --- | --- |
| **html-research-reports** | Always, it's the spine. Self-contained HTML, TL;DR box, navigable sections, per-section sources, the secret-hygiene grep gate, deliberate aesthetic. Read it first. |
| **unslop** | Always, every line. Cut AI tells. |
| **technical-writing** | Always, every line. Diátaxis structure and sentence discipline. |
| **html-architecture-diagrams** | A "what connects to what", data-flow, or deployment-topology picture. |
| **html-svg-diagrams** | Any other diagram: flowchart, sequence, state machine, request/response timeline. |
| **html-timeline-roadmap** | A rollout, phased plan, or timeline. |
| **html-erd-explorer** | A database schema or data model. |
| **html-comparison-matrix** | An options or build-vs-buy evaluation. |
| **html-data-explorer** | A dataset or metrics to browse or chart. |

## House structure

- A sticky sidebar table of contents with numbered sections.
- A "short version" TL;DR box at the top: the three to six things someone who
  reads only the first screen needs.
- Numbered sections, each ending with its own **Sources** footer listing the
  repos, PRs, files, and threads that section drew on. Per-section citations,
  not one list buried at the bottom.
- A theme from `references/plan-themes.md` drives the palette and type
  (`:root` tokens plus fonts); the default is Engineering. Keep the layout
  space-efficient, not floaty: tight vertical rhythm, compact cards, ~68-72ch
  measure. Follow the density rule in that file.
- A footer with a visible last-updated date and the full source list.

## House conventions the composed skills do not cover

- **Cite everything, inline and readable.** Every repo, PR, file, playbook,
  thread, and doc is a link. A reader should be able to check any claim without
  asking.
- **Quotes get attributed blockquotes**, with the speaker's name and a link to
  the source, not folded into a sentence.
- **Verify before asserting.** Read the actual code or doc before stating how
  something works. If a claim cannot be verified, say so and hedge. Prefer a
  background subagent for cross-repo fact-finding so the main thread stays clean.
- **Correct in place, out loud.** When a new fact overturns something the doc
  said, fix it and add a one-line note that an earlier version was wrong, rather
  than editing quietly. The doc is a living record.
- **Convey state by shape or label too, not color alone.**

## Deliver

1. Write the file to a descriptive path, `<topic>-<kind>.html`.
2. Run the secret grep gate (from html-research-reports, or its vendored copy
   `references/html-research-reports/SKILL.md`). It must exit clean before sharing.
3. Publish it with **html-plan-push** (prefer the local skill; it ships in this
   plugin). Push the file as the plan's draft and report the returned draft URL.
   Publishing a shareable version is the human's action in the web UI, do not
   publish on their behalf.
4. Optionally open it locally to review the rendered page: inside cmux, run
   `cmux browser open-split "file://<absolute-path>" --focus true`; otherwise
   `open <absolute-path>`. Do not use `cmux open <path>`, which shows raw markup.
