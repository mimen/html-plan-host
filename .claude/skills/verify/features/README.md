# html-plan-host verification map

Each file is one user-facing feature, driven against the disposable instance from [../SKILL.md](../SKILL.md).

| Feature | Surface | File |
|---|---|---|
| Push a draft (create and update) | CLI `html-plan push` | [push-draft.md](push-draft.md) |
| Read the published baseline | CLI `html-plan baseline` | [baseline.md](baseline.md) |
| Browse plans and view a draft | Browser `/`, `/p/:slug/draft` | [browse-draft.md](browse-draft.md) |
| Publish a version and browse history | Browser `Publish version`, `/p/:slug/versions`, `/p/:slug/v/:n` | [publish-versions.md](publish-versions.md) |
| Heroku sign-in gate | Browser `/auth/*` | [sso-gate.md](sso-gate.md) |

## Baseline preconditions

- `verify.sh up` has run (with `VERIFY_TAILNET=1` for the browser), and `verify.sh doctor` prints only `OK` lines.
- The database is empty at launch. Each run creates its own plans from `fixtures/smoke.html`.

## Proof and skip reporting

- CLI proof is the command, its output, its exit code, and a `psql` row showing the stored effect.
- Browser proof is the MP4 recording plus one screenshot per state change.
- Report a feature that was not driven as unverified, with the missing prerequisite. Do not count another entry point as proof.
