# Read the published baseline

An agent fetches a plan's last published version with the publish token, to write a "changes since last publish" summary.

## Sub-features

- `baseline-unpublished` returns `latestPublishedVersion: null` and `dirty: true` before any publish.
- `baseline-published` returns the version number, title, HTML, and `dirty: false` once the draft matches.

## How to get to it (user POV)

- `html-plan baseline --slug <slug>`

## Driving it with verify.sh

- Before publish, `$V cli baseline --slug $SLUG` shows `"latestPublishedVersion": null`, `"draftSummary": "second draft"`, and `"dirty": true`.
- After a browser publish, the same command shows `"latestPublishedVersion": 1`, `"draftSummary": null`, and `"dirty": false`. Filter `publishedHtml` out of saved evidence with `grep -v publishedHtml`.

## Gotchas

- An unknown slug exits 1 with `baseline failed (404)`.
