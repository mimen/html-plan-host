#!/bin/zsh
set -eu
export PATH="$HOME/.bun/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOST=127.0.0.1 PORT=3490 DATABASE_SSL=disable NODE_ENV=production
export OP_LOAD_DESKTOP_APP_SETTINGS=false
export DATABASE_URL=postgres://127.0.0.1:5490/html_plan_host
export BASE_URL="$(/opt/homebrew/bin/tailscale status --json | /usr/bin/python3 -c 'import json,sys; print("https://"+json.load(sys.stdin)["Self"]["DNSName"].rstrip(".")+":8490")')"
export PUBLISH_TOKEN="$(op read 'op://Sol/HTML Plan Host Personal Credentials/publish_token')"
export SESSION_SECRET="$(op read 'op://Sol/HTML Plan Host Personal Credentials/session_secret')"
unset HEROKU_OAUTH_ID HEROKU_OAUTH_SECRET ALLOWED_EMAILS
cd "${0:A:h:h}"
export APP_REVISION="$(< .release-revision)"
export PROCID="html-plan-host:server@personal"
exec -a "$PROCID" "$HOME/.bun/bin/bun" run src/index.ts
