---
repo_key: html-plan-host
aliases: []
---

# html-plan-host

Html-plan-host stores mutable HTML drafts and numbered published versions at durable URLs. One Hono service serves the browser pages and HTTP API, backed by Postgres. The same service has a work deployment on Heroku and a private personal deployment on the Mini. Agent machines install the CLI and authoring skills as pinned packages.

## Components

| Component | Path | What it is | Surfaces | Stack |
|---|---|---|---|---|
| server | `src/index.ts`, `src/app.ts`, `src/routes/`, `src/views/`, `src/auth.ts`, `src/config.ts`, `src/plans.ts`, `src/session.ts`, `src/slug.ts`, `src/themes.ts` | HTML dashboard, plan and version pages, authentication, and draft-write HTTP API. | web, api, resident | ts, hono, static-html, bun, docker, heroku, launchd |
| database | `src/db.ts` | Postgres tables for plans, mutable drafts, and published versions, initialized at service startup. | backend-data | ts, postgres, heroku, launchd |
| cli | `bin/html-plan.mjs`, `bin/html-plan-bot` | Draft upload and published-baseline commands with machine-local defaults and runtime credential lookup. | cli-tui | js, python, bun |
| agent-skills | `skills/`, `.claude-plugin/` | HTML authoring and draft-push instructions, packaged references, and TypeScript plan-path and view helpers. | configuration, cli-tui | ts, bun, claude-code-plugin |
| agent-install | `bin/bootstrap-agent`, `bin/install-agent`, `bin/setup-bot` | Pinned-package installation, local CLI and skill links, and Bot client setup. | cli-tui, configuration | python |
| agent-refresh | `bin/refresh-agent` | Hourly updater that compares the installed package with main and reinstalls changed revisions through the hub wrapper. | cli-tui, resident | python, launchd |
| mini-deploy | `bin/mini`, `deploy/mini-host.py`, `deploy/serve.zsh` | Immutable Mini releases, activation and rollback, private routing, service definitions, verification, and database backups. | cli-tui, configuration | python, shell, launchd |
| deploy-watch | `deploy/watch.py` | Mini resident that fetches main and activates new revisions without undoing a manual rollback. | resident | python, launchd |

## How they relate

The server owns browser access and API authentication and reads the database. The CLI writes drafts and reads the published baseline; publishing remains a browser action. The installed skills invoke the CLI and their packaged authoring helpers. Agent refresh updates those client packages independently of the Mini deploy watcher, which activates server releases through the Mini deployment tools.

## Repo-level gaps

The deployment runbook documents code rollback and manual database backups, but no scheduled backup policy. Its production verification checks release identity and private routing; product verification also needs real draft create, update, readback, and browser inspection. Heroku deployment wiring is documented in `DEPLOY.md`; this component map does not assert a current Heroku runtime check.
