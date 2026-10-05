---
name: verify
description: Drive html-plan-host the way a user does on a disposable local instance. Push drafts with the html-plan CLI, then read, publish, and browse versions in the browser, capturing transcripts, screenshots, video, and Postgres side effects. Use to prove a server, view, or CLI change before landing, or when asked to verify html-plan-host.
---

# Verify html-plan-host

html-plan-host is one Bun and Hono server over Postgres. Agents write drafts with `bin/html-plan.mjs` and a bearer token. People read plans and publish numbered versions in the browser. This skill runs both surfaces against a throwaway instance. It never touches the Heroku apps, the Mini deployment, or `~/.config/html-plan-host`.

## Launch

```sh
.claude/skills/verify/verify.sh up                    # CLI and curl only
VERIFY_TAILNET=1 .claude/skills/verify/verify.sh up   # also for the T3 preview browser
```

`up` refuses to start when the run directory already exists (a symlink counts too) or when anything listens on 5513 or 5514. A refused run never deletes a directory it did not create. It then does the following, with `umask 077`, appending each resource to `state.env` the moment it exists:

- Runs `initdb` into `/tmp/hph-verify/pg` and starts Postgres on `127.0.0.1:5514`.
- Starts `bun run src/index.ts` from this checkout on `127.0.0.1:5513` under `env -i`, so no shell or user environment leaks in.
- Generates a fresh `SESSION_SECRET` and `PUBLISH_TOKEN`. It sets no Heroku OAuth variables, so reads are open and no login identity is needed. The OAuth gate needs a registered Heroku client per callback URL, so it stays out of local proof.
- Sets `APP_REVISION` to `git rev-parse HEAD`, with a `-dirty` suffix when the tree has changes.
- Records each process's PID, full argv, and `ps` start time, plus the Postgres data directory, the token, and the URL, in `/tmp/hph-verify/state.env`, then runs `doctor`.

If any step fails, an exit trap stops only the resources already recorded and removes the run directory. If that rollback is refused, the state stays for `down` to retry. `VERIFY_FAULT=initdb|pg|server|forwarder` makes `up` fail after that stage, which proves the rollback path.

Set `VERIFY_RUN`, `VERIFY_APP_PORT`, and `VERIFY_PG_PORT` at `up` to change the locations. Use a different `VERIFY_RUN` for each parallel instance. Later commands read the ports and URL from `state.env`. A port override that disagrees with the recorded value is refused.

The T3 preview browser reaches this Mac over Tailscale, not loopback. With `VERIFY_TAILNET=1`, `tailnet-forward.ts` forwards `<tailnet-ip>:5513` to the loopback server. It is reachable only inside the tailnet and lives only for the run. Open the preview at `http://<LocalHostName lowercased>.<tailnet>.ts.net:5513/`. `scutil --get LocalHostName` and `tailscale status --self` give the name.

## Doctor

```sh
.claude/skills/verify/verify.sh doctor
```

Run `doctor` read-only before the first drive and after anything surprising. It fails unless every check below holds:

- Each recorded PID is alive with the exact argv and start time captured at launch. The server must also have this checkout as its cwd. A reused PID fails this check.
- The server PID owns `127.0.0.1:5513` and the Postgres PID owns 5514.
- `GET /version` returns this checkout's revision.
- `GET /` returns 200, which proves auth is off.
- With `VERIFY_TAILNET=1`, the forwarder PID owns the tailnet port and serves the same `/version`.

A failing doctor means a wrong instance. Run `down` and start over. Never drive a server you did not start.

## Drive

Run the CLI through the helper. `cli` and `psql` run `doctor` first and refuse to act when it fails, so neither can drive a replacement process on the port. `cli` pins `--url` and `--token` to the instance and points `PLAN_HOST_CONFIG` at a missing file, so the user's `op://` token reference is never read.

```sh
V=.claude/skills/verify/verify.sh
$V cli push --file fixtures/smoke.html --description "verify run"
sed 's/Draft create verified./Draft update verified./' fixtures/smoke.html > /tmp/hph-verify/smoke-v2.html
SLUG=$($V psql "select slug from plans order by created_at desc limit 1")
$V cli push --file /tmp/hph-verify/smoke-v2.html --slug $SLUG --summary "second draft"
$V cli baseline --slug $SLUG
$V psql "select slug, draft_dirty, draft_summary from plans"   # read-only side-effect check
```

Drive the browser with T3 preview tools in a tab the run opens itself (`preview_open` with `reuseExistingTab: false`). Pass that `tabId` on every call and never touch other tabs. Start `preview_recording_start` before the first navigation. Prefer these handles:

- On the dashboard, the plan card link is `text=<plan title>` and the history link is `text=history`.
- On a plan page, the publish control is `role=button[name='Publish version']`, and only the draft view shows it while unpublished changes exist. The other handles are `text=Versions` and `text=Plans`.
- The versions page links each version as `text=Version <n>` and the draft as `text=Working draft`.
- The plan body renders in a sandboxed iframe from `?raw=1`. Read rendered body text from the screenshot or with `curl '<url>?raw=1'`, because it is not in the parent DOM.

Publish checks the `Origin` header against the request host. It works through the tailnet name because the server derives its base URL from `Host` when `BASE_URL` is unset. Do not set `BASE_URL` on the verify instance.

See [features/README.md](features/README.md) for the recipe per feature.

## Evidence

Write proof to a directory outside the checkout, for example `~/Documents/verification-proofs/<run>/html-plan-host/attempt-<n>/`. Keep failed attempts beside successful ones.

- **CLI.** Save each command line, stdout, stderr, and exit code to a `.txt` file.
- **Browser.** Save the `preview_recording_stop` MP4 and the `preview_snapshot` `save: true` PNG for each state: dashboard, draft before publish, the version after publish, and versions.
- **Side effects.** Save `psql` rows showing `plans.draft_dirty`, `draft_summary`, `draft_updated_by=verify`, and `plan_versions` counts before and after publish. Also save `baseline` output after publish, which shows `latestPublishedVersion: 1` and `dirty: false`.
- **Manifest.** Record the source SHA, `git status --porcelain`, `shasum -a 256` of `verify.sh` and `tailnet-forward.ts`, and the doctor output.
- **Redaction.** `state.env` holds the generated token. Never copy it into evidence.

A screenshot with no recorded action, or a 200 status with no stored row, is not proof. Typecheck and `bun test` are gates, not app proof.

## Cleanup

```sh
.claude/skills/verify/verify.sh down
```

`down` first checks every recorded process that is still alive against its launch argv and start time. If any PID now belongs to a different process, it stops nothing and keeps the state. Otherwise it stops the forwarder and the server by PID and runs `pg_ctl stop` on the run's own data directory. It deletes the run directory only after none of them is running. A run directory that is a symlink, or that has no `state.env`, is left untouched. `down` never kills by name and never touches the evidence directory. Close the run's preview tab with `t3_preview_close`. After cleanup, `ls` the evidence directory to confirm it survived.
