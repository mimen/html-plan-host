---
name: html-plan-push
description: Push an HTML plan, doc, or report to a self-hosted html-plan-host deployment so it lives at a durable, shareable URL with version history. Use after generating or editing an HTML artifact that should be hosted instead of sent as a file. Triggers include "push this plan to the host", "update the hosted plan", "put this on html-plan-host", "give me a shareable link for this doc". Pushes a draft only; publishing a version is a separate human action in the web UI.
metadata:
  author: milad
  version: "1.0.0"
---

# html-plan-push

Push a local HTML file to an [html-plan-host](https://github.com/mimen/html-plan-host)
deployment. The host stores each plan at a durable URL, keeps a version history,
and gates reads behind Google SSO when configured. This skill covers the write
path only.

## The one rule: push drafts, never publish

The host separates two actions on purpose.

- **Push** writes the plan's mutable **draft**. Agents do this freely, as often
  as needed. Every push overwrites the draft.
- **Publish** snapshots the current draft as an immutable, numbered version at
  the shared URL. This is a deliberate human action in the web UI (the "Publish
  version" button in the top bar), and the publish token cannot perform it.

Push drafts. Do not try to publish, and do not tell the user a plan is "shared"
or "live" after a push. After pushing, report the **draft URL** and say the
shared URL updates when they publish the draft in the browser.

## Configuration

Two values identify the target deployment. Read them from the environment; if
either is missing, ask the user which deployment to target rather than guessing.

- `PLAN_HOST_URL` — the deployment's base URL (e.g.
  `https://<app>-<suffix>.herokuapp.com`).
- `PLAN_HOST_TOKEN` — that deployment's `PUBLISH_TOKEN` config var
  (`heroku config:get PUBLISH_TOKEN -a <app>`).

A person may run more than one deployment (for example a personal one and a work
one). These two variables are the only difference between them, so confirm which
is intended when it is ambiguous.

## Pushing

Prefer the `html-plan` CLI (run `bun link` once in the repo to put it on PATH):

```sh
# New plan (title falls back to the HTML <title>):
html-plan push --file plan.html --description "what this plan is about"

# Update an existing plan at the same durable URL (pass its slug):
html-plan push --file plan.html --slug mia-model-pipeline-x8fxoqpp \
  --summary "what changed since the last published version"
```

Flags:

- `--file` the HTML file to upload (required).
- `--slug` update an existing plan's draft; omit to create a new plan.
- `--title` overrides the document's `<title>`.
- `--description` the plan's standing purpose, what it is. Set this once; it is
  plan-level, not per-change.
- `--summary` what changed since the last published version. Set this on the
  push that precedes a publish, so the version's changelog is meaningful.
- `--url` / `--token` override `PLAN_HOST_URL` / `PLAN_HOST_TOKEN`.

If the CLI is not available, POST directly (same contract):

```sh
curl -sS -X POST "$PLAN_HOST_URL/api/plans" \
  -H "Authorization: Bearer $PLAN_HOST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"<optional>","title":"...","description":"...","html":"<full document>","summary":"..."}'
```

## Reading the result

The response includes `created` (true for a new plan, false for an update),
`draftUrl`, and `shareUrl`.

- Report `draftUrl` as the thing to review now.
- Report `shareUrl` as the durable link, noting it reflects the last *published*
  version and only changes when the user publishes the draft.
- If you meant to update an existing plan but `created` is `true`, the `--slug`
  did not match anything and a new plan was created. Stop and confirm the slug
  rather than leaving a stray plan.

Errors are JSON `{ "error": "..." }`. `401` means a bad or missing token; `400`
means a missing `title` or `html`.

## Related skills

This is the publish step for the `html-plan` authoring skill. When composing
plans, prefer the locally installed `html-plan` skill if present; if it is not
installed, its source is https://github.com/mimen/html-plan-host (see
`skills/html-plan`).
