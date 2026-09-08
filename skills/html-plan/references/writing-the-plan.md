# Write the living HTML plan

The editorial contract for the page itself: what earns a place on it, how long it runs, which register to write in, and the behaviors every plan file must have.

## Contents
| Section | What it covers |
|---|---|
| [What earns a place on the page](#what-earns-a-place-on-the-page) | One test governs every inclusion: **does this change a decision?** A detail belongs on the page if it would alter what the reader approves o |
| [Length and layout](#length-and-layout) | No ceiling and no floor |
| [Register](#register) | Pick the shape this change calls for instead of defaulting to a template: - **walkthrough**: plain-language narrative of how it works today, |
| [Required behavior](#required-behavior) | Required behavior |

## What earns a place on the page

One test governs every inclusion: **does this change a decision?** A detail belongs on the page if it would alter what the reader approves or how the work gets built. A detail that is merely true does not.

That test runs in both directions, and the second direction is the one that gets skipped.

**Include the consequential, with its evidence.** A decision that had a real alternative names the alternative and why it lost. A conclusion that took research shows the research: the comparison table, the benchmark, the diagram, the screenshot. Complexity the work is taking on gets named as complexity. Risks and failure modes get stated as risks rather than left off because they are uncomfortable. Ideas and design proposals that shaped the outcome belong here too. If a conclusion is consequential, the reader should be able to see how it was reached, not only what it was.

**Omit the routine, entirely.** Build steps that follow obviously from the decisions. Architecture recitals that restate what the code already says. Non-goals nobody was going to do. Progress scaffolding. Sections emitted to satisfy a template. These are not compressed or summarized, they are left off the page.

There is no required section list and no fixed heading set. Structure the page around what this particular change actually is.

## Length and layout

No ceiling and no floor. The page runs as long as the consequential content requires: a change with four decisions and one real tradeoff might be 200 words, while an audit that reconstructs a system might run several thousand. Shorter is better only when shorter costs nothing. Never drop an important detail to hit a length.

Nothing goes behind a click. No `<details>`, no accordions, no collapsed sections, no "expand for reasoning." Everything on the page is visible on a single scroll.

Open with what changes and what was decided, then put the receipts below. The reader should be able to decide from the top of the page and keep reading downward for as long as they want the evidence.

## Register

Pick the shape this change calls for instead of defaulting to a template:

- **walkthrough**: plain-language narrative of how it works today, what changes, and what happens after, with decisions embedded where they arise. The right default for most work.
- **before and after**: teaching by contrast, for when the delta is the point.
- **diagram first**: one picture of the system carrying the structure, with decisions as numbered callouts, for when the change is about where boundaries sit.

Define a term the first time it appears. Write prose that carries the reasoning and reserve bullets for genuine enumerations. Give quantities visual treatment, since a chart or comparison table carries a tradeoff better than a paragraph restating numbers. Invoke the `dataviz` skill before writing any chart and `frontend-design` for visual direction, when the running harness offers them.

The recognizable failure, the thing this section exists to prevent, is a page of near-identical bulleted assertions in project shorthand: every decision stated, none explained, no alternative named, no evidence shown, everything at the same visual weight. Such a page can be short and accurate and still be useless.

## Required behavior

- self-contained: one file, every style and script inline, assets embedded, because it is opened from disk and must render fully with no network. No CDN scripts, remote stylesheets, or hosted fonts;
- read-only: no forms, approval buttons, or feedback controls;
- nothing hidden: no `<details>`, accordions, tabs, or any other control that puts page content behind an interaction;
- include the absolute artifact path and current status;
- use local file links with absolute paths where useful, and open links outside the plan with `target="_blank" rel="noopener"` so the dedicated plan surface remains addressable;
- before approval, label the plan as awaiting implementation authorization;
- after approval, the plan freezes; see the gate section of the skill body;
- never silently rewrite approved scope; surface proposed deviations in chat.

Completion criterion: the HTML opens standalone, accurately reflects the current thread, and does not imply approval that has not occurred.
