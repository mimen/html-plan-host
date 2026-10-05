# Heroku sign-in gate

When `HEROKU_OAUTH_ID` and `HEROKU_OAUTH_SECRET` are set, every read route redirects to `id.heroku.com`. The callback admits only emails matching `ALLOWED_EMAILS`.

## Sub-features

- `login-redirect` sends an anonymous `GET /` to Heroku authorize with a state cookie.
- `callback` exchanges the code, checks the email allow-list, and sets the session cookie.
- `boot-refusal` makes startup throw when OAuth is set and `ALLOWED_EMAILS` is empty.

## How to get to it (user POV)

- Open any page on a deployment with OAuth configured.

## Driving it with verify.sh

Unverified locally. A real sign-in needs a Heroku OAuth client registered for this exact callback URL and a Heroku test account on the allow-list. Neither exists for a disposable instance, and registering one is a credential change outside verification. `tests/config.test.ts` covers the allow-list matching, but that is not app proof.

## Gotchas

- Do not point the verify instance at the production OAuth client. Its callback is fixed to the deployed URL.
