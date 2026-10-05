# Browse plans and view a draft

A reader opens the dashboard, picks a plan, and sees the working draft rendered under a top bar.

## Sub-features

- `dashboard` shows each plan card with title, description, a `Draft` or `v<n>` badge, and a `history` link. The subtitle reads `Auth disabled` when OAuth is off.
- `draft-view` loads `/p/:slug/draft` with the status `Draft unpublished` and a `Publish version` button. The body renders in a sandboxed iframe from `?raw=1`.
- `share-url-fallback` redirects `/p/:slug` to the draft when nothing is published.

## How to get to it (user POV)

- Open the host root and select a plan card.

## Driving it with T3 preview

- `preview_navigate` to `http://<host>.<tailnet>.ts.net:5513/`. The snapshot shows `HTML Plans`, `Auth disabled`, and the plan card.
- `preview_click` on `text=Personal plan host` lands on `/p/<slug>/draft`. The screenshot shows `Draft unpublished`, `Publish version`, and the iframe text `Draft update verified.`.
- `curl -sI 'http://127.0.0.1:5513/p/<slug>/draft?raw=1'` returns `Content-Security-Policy: sandbox allow-scripts`.

## Gotchas

- The iframe body is absent from `visibleText`, so assert it from the screenshot or the `?raw=1` body.
