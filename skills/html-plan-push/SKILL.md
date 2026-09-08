---
name: html-plan-push
description: Push an HTML plan, doc, or report to a self-hosted html-plan-host deployment so it lives at a durable, shareable URL with version history. Use after generating or editing an HTML artifact that should be hosted instead of sent as a file. Triggers include "push this plan to the host", "update the hosted plan", "put this on html-plan-host", "give me a shareable link for this doc". Pushes a draft only; publishing a version is a separate human action in the web UI.
metadata:
  author: milad
  version: "1.1.0"
---

# html-plan-push

Push a local HTML file to an [html-plan-host](https://github.com/mimen/html-plan-host)
deployment. The host stores each plan at a durable URL, keeps a version history,
and gates reads behind Heroku SSO when configured. This skill covers the write
path only.

## Push automatically, don't ask

For an authorized hosted-plan task, push the draft after each material edit and
report its URL. Compute the summary from the published baseline rather than
asking the user to write it. Existing instructions about sensitive content and
external publication still apply.

Drafts have the same read-access gate as published versions. On a private
Tailscale deployment, anyone permitted to reach the host can read them. On an
open public deployment, drafts are public. A durable URL with no published
version redirects to the draft. Push does not mint a numbered version.

## Draft, never publish

The host separates two actions on purpose.

- **Push** writes the plan's mutable **draft**. Agents do this freely, every edit.
- **Publish** snapshots the current draft as an immutable, numbered version at the
  shared URL. This is a deliberate human action in the web UI (the "Publish
  version" button in the top bar), and the publish token cannot perform it.

Never try to publish, and don't tell the user a plan is "shared" or "live to the
team" after a push. Report the draft URL, and note the shared URL updates when
they publish in the browser.

## Configuration

The CLI uses `~/.config/html-plan-host/config.json` with `url` and a `tokenRef`
pointing to 1Password. It reads the token at runtime. `PLAN_HOST_CONFIG` can
select another config file. [Deployment setup](../../DEPLOY.md#agent-publishing)
covers installation.

Explicit `--url`/`--token` flags and `PLAN_HOST_URL`/`PLAN_HOST_TOKEN` environment
variables override the defaults. A different host does not inherit the personal
token reference. Use a matched URL and token for work, and keep secret values out
of arguments, logs, and plan files. A missing configuration or an unreachable
private host is a setup gap, not a reason to publish elsewhere.

## Summary: cumulative since the last published version

The draft's summary must describe **every change since the last published
version**, not just your most recent edit. Before pushing an update, fetch the
published baseline with the token:

```sh
html-plan baseline --slug <slug>
# -> { latestPublishedVersion, publishedTitle, publishedHtml, draftSummary, dirty }
```

- If `latestPublishedVersion` is `null` (nothing published yet), summarize the
  draft's substance from scratch.
- Otherwise, compare `publishedHtml` to the new content you are about to push and
  write a summary covering the **full delta from that published version to now**.
  Because you always diff against the published baseline (not the previous draft),
  the summary stays cumulative across every interim push on its own.

Pass it as the summary on the push; it overwrites the draft summary each time.
When the human publishes, that summary becomes the version's changelog and the
cycle resets against the new baseline.

## Pushing

Prefer the `html-plan` CLI (run `bun link` once in the repo to put it on PATH):

```sh
# New plan (title falls back to the HTML <title>):
html-plan push --file plan.html --description "what this plan is about"

# Update an existing plan at the same durable URL (pass its slug), with the
# cumulative-since-publish summary computed above:
html-plan push --file plan.html --slug mia-model-pipeline-x8fxoqpp \
  --summary "all changes since v3: ..."
```

Flags: `--file` (required), `--slug` (update vs create), `--title` (overrides the
`<title>`), `--description` (the plan's standing purpose; set once, plan-level),
`--summary` (cumulative since last published, per above), `--url` / `--token`
(override the env).

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

- Report `draftUrl` as the live draft.
- Report `shareUrl` as the durable link, noting it reflects the last *published*
  version and only changes when the user publishes.
- If you meant to update an existing plan but `created` is `true`, the `--slug`
  did not match; stop and fix the slug rather than leaving a stray plan.

Errors are JSON `{ "error": "..." }`. `401` is a bad or missing token; `400` is a
missing `title` or `html`.

## Related skills

This is the publish step for the `html-plan` authoring skill. When composing
plans, prefer the locally installed `html-plan` skill if present; if not, its
source is https://github.com/mimen/html-plan-host (see `skills/html-plan`).
