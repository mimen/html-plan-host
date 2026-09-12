---
deployment_status: verified
deployment_production_trigger: explicit bin/mini deploy of a committed revision
deployment_branch_command: bun run dev with a separate database and port
deployment_verify_command: bin/mini verify
deployment_last_assessed: 2026-09-07
---

# Deployment

## Personal Mini

The personal instance runs on the Mini behind Tailscale Serve HTTPS port 8490. It has no public Funnel route and no Heroku OAuth. Tailnet access is the read gate for both drafts and published versions. Anyone permitted to reach that port can read plans and use the browser's Publish button. Agents push drafts with a bearer token and leave publication to the user.

The app listens on `127.0.0.1:3490`. Its dedicated Postgres 17 cluster listens on `127.0.0.1:5490`. Neither listener accepts LAN connections. Local database access trusts processes on the Mini; this is a single-user host, not isolation from other local processes.

| Command | Purpose |
|---|---|
| `bun install --frozen-lockfile && bun run dev` | Local development with a separate database and `PORT` |
| `bin/mini deploy HEAD` | Install and activate the committed revision on the personal Mini |
| `bin/mini status` | Inspect the two LaunchAgents and Tailscale routing |
| `bin/mini verify` | Check live revision, health, private routing, and loopback listeners |
| `bin/mini backup` | Dump Postgres and copy a protected snapshot to the calling Mac |
| `bin/mini deploy <previous-sha>` | Roll back code using an earlier committed revision |

`PLAN_MINI_SSH` selects the SSH alias, default `macmini`. Deployment resolves the remote home directory over SSH. It transfers a Git archive into `~/Programming/Deployments/html-plan-host/releases/<sha>`, installs locked dependencies, runs tests and typecheck, snapshots the database, and changes the `current` symlink. A failed activation restores the previous code release when one exists. Releases are immutable; uncommitted trees cannot deploy. Branches do not auto-deploy or receive public previews.

Two user LaunchAgents keep the app and database running. They start after login, not before FileVault unlock. The server uses `html-plan-host:server@personal` argv identity; Postgres uses `html-plan-host:postgres@personal` as its cluster name. The service does not depend on this agent session staying open.

### Prerequisites

- Bun at `~/.bun/bin/bun`, Postgres 17 at `/opt/homebrew/opt/postgresql@17`, and Tailscale at `/opt/homebrew/bin/tailscale`.
- A working `macmini` SSH alias on the deploying Mac, with Tailscale access to port 8490.
- 1Password CLI on the Mini. Its existing `~/.zshenv` supplies the read-only service-account token to the service's zsh launcher.
- `op://Sol/HTML Plan Host Personal Credentials/publish_token` and `op://Sol/HTML Plan Host Personal Credentials/session_secret`. Runtime reads keep their values out of repository files and LaunchAgent definitions.

### Data and recovery

The cluster, logs, and pre-deploy dumps live under `~/.local/share/html-plan-host`, outside the releases. `bin/mini backup` also stores a copy under the calling Mac's `~/Library/Application Support/html-plan-host/backups`. There is no new scheduled backup job. Configure and verify a separate backup policy before relying on unattended recovery. The Mini had no Time Machine destination configured at setup.

Code rollback does not roll back data. Before a destructive schema change, take a dump and obtain approval. Restore first into a separate database with `pg_restore`, check plan contents and version counts, then obtain approval before replacing the live database. Never delete the data directory or run `tailscale serve reset` as cleanup. Old release directories may be removed only after checking that `current` does not reference them.

## Agent publishing

The repo owns the [authoring skill](skills/html-plan/SKILL.md), its path and view helpers, and the [push skill](skills/html-plan-push/SKILL.md). Install a pushed, pinned revision independently on each agent machine:

```sh
python3 bin/bootstrap-agent --revision <full-commit-sha> \
  --url https://<mini-tailnet-dns>:8490 \
  --token-ref 'op://Sol/HTML Plan Host Personal Credentials/publish_token'
```

The bootstrap fetches the GitHub archive directly into `~/.local/share/html-plan-host/packages/<sha>`. `bin/install-agent` links its CLI through `~/.local/bin/html-plan` and its skills through `~/.codex/skills` and `~/.agents/skills`. It rejects conflicting existing files instead of overwriting them. This installation does not edit Claude's settings or copy packages into the synced vault. In the personal fleet, the synced house `html-plan` entry is only an adapter that reads the installed package. Other Claude installations can use the repo's native marketplace plugin instead.

A machine-local, nonsecret `~/.config/html-plan-host/config.json` selects the personal deployment:

```json
{
  "url": "https://<mini-tailnet-dns>:8490",
  "tokenRef": "op://Sol/HTML Plan Host Personal Credentials/publish_token"
}
```

The CLI reads that reference through `op` per invocation. Flags and `PLAN_HOST_URL`/`PLAN_HOST_TOKEN` override defaults for work instances. A URL override never inherits the personal token reference for a different host. `html-plan baseline --slug <slug>` fetches the published baseline without exporting secrets into the shell.

Plan sources remain in their projects. Agents push changes to drafts and report the draft URL; the user publishes numbered versions in the browser. Drafts are not a separate privacy boundary. For a new plan with no published version, its durable URL redirects to its draft.

## Grok Bot VM

Keep the repo package under `/workspace/repos/html-plan-host`, which survives VM refreshes. Read the packaged skills there. Setup exposes `html-plan` through `/usr/local/bin/html-plan`, linked to the package's `bin/html-plan-bot` wrapper. That wrapper adds the existing local binary directory to PATH and reads the existing VM service-account environment without evaluating shell code. It never copies the publishing token into a file.

Run `python3 bin/setup-bot --url <private-url> --tailnet-ip <mini-tailnet-ip> --token-ref <op-reference>` after a refresh. It tightens the existing 1Password directory permissions and adds only the configured Mini hostname to `/etc/hosts`, preserving HTTPS certificate verification. This avoids the VM's public DNS returning Funnel addresses for a private Serve endpoint. Existing conflicting host or client settings stop setup. The command does not configure Tailscale itself or expose any public port.

The VM must already have Bun, `~/.local/bin/op`, its own `~/.config/op/service-account.env`, and a working private route to the Mini. A missing or revoked VM credential is a separate recovery task, not permission to copy another machine's token. Bot charters reach these skills through their shared preamble; native skill-catalog installation is not required.

## Work Heroku instance

The existing [Heroku deployment instructions](README.md#deploy-to-heroku-container) remain the work path. The Mini command never runs Heroku commands, imports work data, or modifies work credentials. GitHub has an active `kolkrabbi.heroku.com` webhook, so commits on `main` deploy to `milad-plans`. Mini-only settings (`HOST=127.0.0.1`, `DATABASE_SSL=disable`, Tailscale Serve) stay off that app. Unset `DATABASE_SSL` plus a Heroku `DYNO` keeps the previous required-SSL default.

## Verification

`bin/mini verify` proves deployment identity and access topology, not all product behavior. A release also needs a real draft create and update through `html-plan`, a readback at the same URL, baseline inspection showing no published version, and browser inspection of the draft. Tests cover the configurable bind address and database TLS, publish request restrictions, raw HTML sandboxing, deployment rollback, and installer overwrite guards.

Setup proof on 2026-09-07: 56 Bun tests, six Python regressions, typecheck, and GitHub CI passed. The M5 created a real draft through its installed CLI; the Mini updated it at the same URL using its own runtime credential lookup. Readback confirmed the update and zero published versions. A headless browser rendered the draft, executed its inline script, and navigated to the versions page with no page errors. A Postgres dump was copied to the M5 and restored into an isolated database; the updated draft and zero-version state survived. The temporary restore database was removed. `bin/mini verify` confirmed private routing, loopback listeners, process identities, and the dedicated cluster name.
