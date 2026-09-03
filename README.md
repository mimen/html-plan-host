# html-plan-host

A personal service for hosting versioned HTML plans behind Heroku SSO, with
durable URLs. Publish a plan once, share the link in Slack, then push updates to
the *same URL* instead of re-uploading a file. Every publish is snapshotted as a
timestamped version you can browse and reopen.

- **Durable URL per plan** — `/p/<slug>` always serves the latest version.
- **Versioning** — each publish adds a timestamped version; `/p/<slug>/versions`
  lists them, `/p/<slug>/v/<n>` reopens an old one (with a "not latest" banner).
- **SSO read gate** — reading requires a Heroku sign-in whose account email is
  on an allowed domain (`salesforce.com`, `heroku.com` by default).
- **Token-based publish** — the CLI writes plans with a bearer token, no browser.

## Stack

Bun + [Hono](https://hono.dev) + Postgres. Deployed to Heroku as a container.

## Local development

Needs a local Postgres.

```sh
bun install
createdb html_plan_host
cp .env.example .env         # then fill in the blanks (see below)
bun run dev
```

Generate the two secrets:

```sh
openssl rand -hex 32   # SESSION_SECRET
openssl rand -hex 32   # PUBLISH_TOKEN
```

Sign-in uses Heroku OAuth. Local dev typically runs with auth off (no
credentials); a Heroku OAuth client's callback is fixed at registration, so
local sign-in needs its own client pointed at `http://localhost:3000/auth/callback`.

## Heroku OAuth setup

Register a Heroku OAuth client whose callback is this deployment's URL:

```sh
heroku clients:create "html-plan-host" "https://<your-app-url>/auth/callback"
```

It prints an `id` and `secret`. Set them as `HEROKU_OAUTH_ID` and
`HEROKU_OAUTH_SECRET`. The callback is baked into the client, so it is not passed
during the flow; register one client per deployment URL.

## Auth and access (config-driven)

The service is deployment-agnostic. One codebase runs any number of Heroku apps,
each shaped by its config vars.

- **Auth is implicit.** Set both `HEROKU_OAUTH_ID` and `HEROKU_OAUTH_SECRET`
  and sign-in is required. Leave them unset and reads are open (no login).
- **`ALLOWED_EMAILS`** is a comma-separated list of glob patterns matched against
  the signed-in Heroku account email, required whenever auth is on:
  - `*.salesforce.com, *.heroku.com` matches a domain and its subdomains
  - `someone@heroku.com` matches one specific person
  - `*` matches any authenticated Heroku account

If auth is on and `ALLOWED_EMAILS` is empty, the app refuses to boot rather than
locking everyone out or letting everyone in.

## Deploy to Heroku (container)

```sh
APP=your-app-name   # globally unique on Heroku

heroku create "$APP" --stack container
heroku addons:create heroku-postgresql:essential-0 -a "$APP"

# Open reads (no login): omit the HEROKU_OAUTH_* and ALLOWED_EMAILS vars.
# Gated reads: set all three.
heroku config:set -a "$APP" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  PUBLISH_TOKEN="$(openssl rand -hex 32)" \
  HEROKU_OAUTH_ID="..." \
  HEROKU_OAUTH_SECRET="..." \
  ALLOWED_EMAILS="*.salesforce.com, *.heroku.com" \
  NODE_ENV="production"

heroku git:remote -a "$APP"
git push heroku main   # first deploy; heroku.yml builds the container
```

`DATABASE_URL` is set automatically by the Postgres addon. The schema is created
idempotently on boot, so there's no migration step.

Heroku's default domain includes a random suffix (e.g.
`your-app-name-a1b2c3.herokuapp.com`). Get the exact URL with
`heroku apps:info -a "$APP"`. If you enable OAuth, set `BASE_URL` to that URL and
add `<url>/auth/callback` as an authorized redirect URI on the Heroku OAuth client.

For auto-deploy on every push to `main`, open the app's **Deploy** tab, connect
this GitHub repo, and enable **Automatic deploys** (no CI wait needed). The
dashboard builds the container from `heroku.yml`.

Grab the publish token for the CLI:

```sh
heroku config:get PUBLISH_TOKEN -a "$APP"
```

## Pushing plans (CLI)

The `html-plan` CLI pushes an HTML file to a plan's draft. Link it once to put
it on your PATH:

```sh
bun link
```

Then:

```sh
export PLAN_HOST_URL="https://your-app-name-a1b2c3.herokuapp.com"   # heroku apps:info -a <app>
export PLAN_HOST_TOKEN="<PUBLISH_TOKEN>"                            # heroku config:get PUBLISH_TOKEN -a <app>

# Create a new plan (title falls back to the HTML <title>):
html-plan push --file plan.html --description "what this plan is about"

# Update an existing plan's draft at the same durable URL:
html-plan push --file plan.html --slug mia-model-pipeline-x8fxoqpp \
  --summary "what changed since the last published version"
```

`push` writes the **draft** only. It never mints a published version, that's a
human action in the web UI (the "Publish version" button in the top bar). Run
`html-plan --help` for all options. Agents can also `POST /api/plans` directly
with the bearer token instead of using the CLI.

## Routes

Read routes require a Heroku session only when OAuth is configured; otherwise
they're open.

| Route | Auth | Purpose |
| --- | --- | --- |
| `GET /` | session | Dashboard of all plans |
| `GET /p/:slug` | session | Latest published version (redirects to the draft if none published) |
| `GET /p/:slug/draft` | session | The working draft |
| `GET /p/:slug/versions` | session | Draft plus the published changelog |
| `GET /p/:slug/v/:n` | session | A specific published version |
| `POST /p/:slug/publish` | session | Mint a new version from the draft (human only) |
| `POST /api/plans` | bearer token | Push a draft (create or update) |
| `GET /auth/login` `…/callback` `…/logout` | — | Heroku OAuth flow (when configured) |
| `GET /healthz` | — | Health check |
