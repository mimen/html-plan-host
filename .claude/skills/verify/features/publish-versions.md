# Publish a version and browse history

A reader mints a numbered version from the draft, and the share URL and history then show it. Publishing is browser-only. Bearer and cross-origin posts are refused.

## Sub-features

- `publish` posts the form to `/p/:slug/publish`, redirects to `/p/:slug`, and shows `v1 latest`.
- `versions` lists `Version n`, the `latest` badge, the publisher, and the draft summary of that publish.
- `version-view` serves `/p/:slug/v/:n` with older and newer arrows. A missing `n` returns 404.
- `publish-guard` returns `403` for a POST without `Origin` or with an `Authorization` header.

## How to get to it (user POV)

- On a draft with unpublished changes, select `Publish version` in the top bar, then `Versions`.

## Driving it with T3 preview

- On the draft page, `preview_click` on `role=button[name='Publish version']`. The URL becomes `/p/<slug>` and the bar reads `v1 latest`.
- `preview_click` on `text=Versions`. The page lists `Version 1`, `latest`, `by you`, and `second draft`.
- `$V psql "select version, published_by, summary from plan_versions"` returns `1|you|second draft`, and `plans.draft_dirty` becomes `f`.
- For the guard, `curl -X POST .../p/<slug>/publish` returns 403. Adding `-H 'Origin: http://127.0.0.1:5513' -H 'Authorization: Bearer x'` also returns 403, and the version count is unchanged.

## Gotchas

- With auth off, `published_by` is `you`.
- `BASE_URL` must stay unset, or the tailnet `Origin` fails the publish check.
