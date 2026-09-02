# html-plan-host

A personal service for hosting versioned HTML plans behind Google SSO, with
durable URLs. Publish a plan once, share the link in Slack, then push updates to
the *same URL* instead of re-uploading a file. Every publish is snapshotted as a
timestamped version you can browse and reopen.

- **Durable URL per plan** — `/p/<slug>` always serves the latest version.
- **Versioning** — each publish adds a timestamped version; `/p/<slug>/versions`
  lists them, `/p/<slug>/v/<n>` reopens an old one (with a "not latest" banner).
- **SSO read gate** — reading requires a Google sign-in whose verified email is
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

For a fully working sign-in locally you also need Google OAuth credentials (see
below) with `http://localhost:3000/auth/callback` added as an authorized
redirect URI.

## Google OAuth setup

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth 2.0 Client ID** of type **Web application**.
2. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (local dev)
   - `https://<your-app>.herokuapp.com/auth/callback` (production)
3. Copy the client ID and secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## Auth and access (config-driven)

The service is deployment-agnostic. One codebase runs any number of Heroku apps,
each shaped by its config vars.

- **Auth is implicit.** Set both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  and sign-in is required. Leave them unset and reads are open (no login).
- **`ALLOWED_EMAILS`** is a comma-separated list of glob patterns matched against
  the signed-in email, required whenever auth is on:
  - `*.salesforce.com, *.heroku.com` matches a domain and its subdomains
  - `someone@gmail.com` matches one specific person
  - `*` matches any verified Google account

If auth is on and `ALLOWED_EMAILS` is empty, the app refuses to boot rather than
locking everyone out or letting everyone in.

## Deploy to Heroku (container)

```sh
heroku create milad-plans --stack container
heroku addons:create heroku-postgresql:essential-0 -a milad-plans

# Open reads (no login): omit the GOOGLE_* and ALLOWED_EMAILS vars below.
# Gated reads: set all three.
heroku config:set -a milad-plans \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  PUBLISH_TOKEN="$(openssl rand -hex 32)" \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..." \
  ALLOWED_EMAILS="*.salesforce.com, *.heroku.com" \
  BASE_URL="https://milad-plans.herokuapp.com" \
  NODE_ENV="production"

git init && git add -A && git commit -m "Initial html-plan-host"
heroku git:remote -a milad-plans
git push heroku main
```

`DATABASE_URL` is set automatically by the Postgres addon. The schema is created
idempotently on boot, so there's no migration step.

Grab the publish token for the CLI:

```sh
heroku config:get PUBLISH_TOKEN -a milad-plans
```

## Publishing plans

```sh
export PLAN_HOST_URL="https://milad-plans.herokuapp.com"
export PLAN_HOST_TOKEN="<PUBLISH_TOKEN>"

# Create a new plan (title is read from the HTML <title> if not passed):
bun run bin/publish.mjs --file plan.html

# ...prints a durable URL. To update that plan later, pass its slug:
bun run bin/publish.mjs --file plan.html --slug mia-model-pipeline-x8fxoqpp
```

Publishing with an existing `--slug` appends a new version at the same URL;
omitting `--slug` mints a new plan with a fresh unguessable slug.

## Routes

| Route | Auth | Purpose |
| --- | --- | --- |
| `GET /` | session | Dashboard: all plans, last-updated, version counts |
| `GET /p/:slug` | session | Latest version of a plan |
| `GET /p/:slug/versions` | session | Timestamped version list |
| `GET /p/:slug/v/:n` | session | A specific old version (banner if not latest) |
| `POST /api/plans` | bearer token | Publish/update a plan |
| `GET /auth/login` `…/callback` `…/logout` | — | Google OAuth flow |
| `GET /healthz` | — | Health check |
