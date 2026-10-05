# Push a draft

An agent uploads an HTML file as a plan's draft. Without `--slug` it creates a plan with a random-suffixed slug. With `--slug` it overwrites that plan's draft at the same URL. Push never creates a published version.

## Sub-features

- `push-create` creates a plan. The title falls back to the HTML `<title>`.
- `push-update` overwrites the draft and sets `draft_summary` from `--summary`.
- `push-reject` returns `401` for a wrong token, `400` for an empty title or HTML, and `400` for a description over 150 characters.

## How to get to it (user POV)

- `html-plan push --file plan.html [--slug s] [--description d] [--summary s]`

## Driving it with verify.sh

- `$V cli push --file fixtures/smoke.html --description "verify run"` exits 0 and prints `Created draft for "Personal plan host"` with a draft URL.
- `sed 's/Draft create verified./Draft update verified./' fixtures/smoke.html > /tmp/hph-verify/smoke-v2.html`, then `$V cli push --file /tmp/hph-verify/smoke-v2.html --slug $SLUG --summary "second draft"` prints `Updated draft`.
- `$V psql "select draft_dirty, draft_summary, draft_updated_by, position('update verified' in draft_html)>0 from plans"` returns `t|second draft|verify|t`, and `plan_versions` stays at 0 rows.
- For the reject path, run `bin/html-plan.mjs push` with `--token wrong` and `PLAN_HOST_CONFIG=/nonexistent`. It exits 1 with `push failed (401)`.

## Gotchas

- The CLI accepts plain HTTP only on loopback, so use `http://127.0.0.1:5513`, never the tailnet name.
- Without `PLAN_HOST_CONFIG` pointed elsewhere, the CLI reads `~/.config/html-plan-host/config.json` and its `op://` token. `verify.sh cli` already prevents that.
