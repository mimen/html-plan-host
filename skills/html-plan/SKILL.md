---
name: html-plan
description: Make an HTML page a person will look at or use, and host it at a durable URL that opens on any machine. Plans, reports, references, design mockups, prototypes, comparisons, explainers. Use when a page will read or look better than chat, for "html plan", "/html-plan", "mock this up", "make a page for X", or "give me a link I can open on my other machine". Pushes with html-plan-push.
metadata:
  author: milad
  version: "2.0.0"
---

# html-plan

Make one self-contained HTML page, show it, and host it when it needs to travel. There is no house template. Pick the structure and the look the content calls for: a one-screen decision, a long reference with a table of contents, a clickable mockup, a gallery of design options, a chart. Two pages on different topics should not look alike unless the content is alike.

## When a page earns its place

- The content is visual (a layout, a flow, a mockup, a chart) or long enough that headings and navigation help.
- The user asks for a page, a mockup, a link, or something to open elsewhere.
- Short answers, one decision, and status stay in chat. Approval always happens in chat, never on the page.

## Make it render in both places

T3 Code shows a page inline with `html_render`, and the plan host serves it in a browser tab. Write to T3's contract and the page looks native in both. The host injects the same theme tokens T3 does, with light and dark following the OS, plus a centered column on wide screens.

- Color with T3's CSS variables, never fixed colors for chrome: `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--card`, `--popover`, `--secondary`, `--border`, `--ring`, `--primary`, `--accent`, `--destructive`, `--warning`, `--success`, `--info`, `--code-background`, each with a `-foreground` where one exists, `--accent-surface`, `--destructive-surface`, `--warning-surface`, `--chart-1` to `--chart-6`, `--radius`, `--font-sans`, `--font-mono`.
- Leave `html` and `body` without a background, outer card, border, banner, or side padding. The base sheet paints the canvas.
- Use fluid widths. T3's frame is 728px on desktop and about 360px on phones.
- Never use `vh` units or `height: 100%` on `html` or `body`. T3 rejects them. Give charts fixed pixel heights and let content set the page height.
- Boxes that need their own surface get `var(--card)`, 16px padding, and `var(--radius)` corners.
- Inline all CSS and JS. Embed local images as data URIs or use `https` URLs. Relative paths to sibling files break on both surfaces.

A design that must carry its own palette (a brand mockup, a poster, a dark-only UI) can set a background on `html` or `body`. The host then skips its injection and serves the page as written. Do this on purpose, not by habit.

## Say what is real

- Link every claim a reader may want to check: repos, PRs, files, threads, docs. Read the source before asserting how something works, and mark anything unverified.
- Label mockups and proposals as mockups and proposals, so nobody reads a design as shipped behavior.
- When a new fact overturns the page, fix it and say in one line that an earlier version was wrong.

## Show it and host it

1. Write the file once per topic and keep editing that file. Put it in the project it is about, under `plans/` or the project's existing docs location, or in the session scratch directory when no project fits. Name it `<topic>.html`.
2. In a T3 Code thread, show it inline: `html_preview` with the path to check layout and get `contentHeight`, then `html_render` with that height.
3. Before pushing, check for secrets. This must print nothing:
   `grep -nEi '(api[_-]?key|secret|token|password|bearer)["'"'"' ]*[:=] *["'"'"'][^"'"'"']{8,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}' <file>`
4. Push with the sibling [html-plan-push skill](../html-plan-push/SKILL.md) when the page should open on another machine or be shared, and give the user the draft URL. Push again with the same `--slug` after every material edit. A push writes a draft; publishing a numbered version is the user's button in the web UI.
