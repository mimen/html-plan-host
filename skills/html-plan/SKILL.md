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

## Composed skills (use local, else fall back)

For each capability below, prefer the locally installed skill if present, and
invoke it rather than restating its rules. If a skill is not installed, follow
the distilled essentials in `references/composed-skills.md`, which is the
minimal vendored fallback so this skill works standalone.

- **html-research-reports** is the spine: the self-contained HTML file, the core
  structure (TL;DR, navigable sections, per-section sources), the mandatory
  secret-hygiene grep gate, and the "pick a deliberate aesthetic, not the
  generic AI look" rule.
- **html-architecture-diagrams** for "what connects to what" and data-flow
  pictures; **html-svg-diagrams** for other diagram shapes. Always inline SVG
  with a legend, never a flexbox-and-arrows hack.
- **unslop** and **technical-writing** apply to every line.
- **html-plan-push** (ships in this plugin) is the publish step, see Deliver.

## House structure

- A sticky sidebar table of contents with numbered sections.
- A "short version" TL;DR box at the top: the three to six things someone who
  reads only the first screen needs.
- Numbered sections, each ending with its own **Sources** footer listing the
  repos, PRs, files, and threads that section drew on. Per-section citations,
  not one list buried at the bottom.
- A deliberate engineering-ops aesthetic driven by theme tokens in `:root`:
  near-black background, a distinctive heading and monospace typeface, one
  accent color plus green/amber/red for state.
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
2. Run the secret grep gate (from html-research-reports, or
   `references/composed-skills.md`). It must exit clean before sharing.
3. Publish it with **html-plan-push** (prefer the local skill; it ships in this
   plugin). Push the file as the plan's draft and report the returned draft URL.
   Publishing a shareable version is the human's action in the web UI, do not
   publish on their behalf.
4. Optionally open it locally to review the rendered page: inside cmux, run
   `cmux browser open-split "file://<absolute-path>" --focus true`; otherwise
   `open <absolute-path>`. Do not use `cmux open <path>`, which shows raw markup.
