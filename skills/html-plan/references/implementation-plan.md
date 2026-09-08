# Maintain an implementation plan

Use this leaf only for a semantically major implementation plan, cross-system work, or a planning thread that has reached two substantive decision rounds. Bounded work should proceed directly.

## Resolve the plan path

Choose the persistent project root, not a worktree, `$HOME`, a shared repositories directory, or an agent state directory. Read [plan-path.md](plan-path.md) before resolving a path in a new project.

Run the helper from this installed skill:

```bash
bun "<installed-html-plan-skill>/scripts/html-plan.ts" resolve \
  --project-root "<absolute-target-project-root>" \
  --slug "<stable-topic-slug>"
```

`resolve` is pure. It returns the selected project root, directory, file, and convention without creating anything. Reuse the same HTML file for the planning thread.

Investigate the relevant code, instructions, tests, and existing plans. Look up observable facts instead of asking the user. Keep confirmed facts, locked decisions, assumptions, and open questions distinct. Update the same plan after each material decision.

## Prepare, write, and keep the view current

Immediately before the first write, create the selected directory and confirm that the path has not changed:

```bash
bun "<installed-html-plan-skill>/scripts/html-plan.ts" prepare \
  --project-root "<absolute-target-project-root>" \
  --slug "<stable-topic-slug>"
```

Pass the same `--plan-dir` to `prepare` if `resolve` used one. Write the page according to [writing-the-plan.md](writing-the-plan.md).

Open the plan on creation and on an explicit request to reopen it. Refresh it after every material update:

```bash
bun "<installed-html-plan-skill>/scripts/html-plan.ts" open --file "<absolute-plan-path>"
bun "<installed-html-plan-skill>/scripts/html-plan.ts" refresh --file "<absolute-plan-path>"
```

The helpers preserve the plan surface in Cmux without stealing focus or creating duplicate panes. Read [surface-control.md](surface-control.md) when that behavior needs diagnosis.

When every material decision is settled, run one presentation pass using the Fable model and the prompt in [plan-writer-pass.md](plan-writer-pass.md). If Fable is unavailable, do the pass yourself. Do not retry automatically or silently substitute another model.

## Push the draft

Push after material edits through `html-plan-push`. If that skill is not installed, read the sibling [`html-plan-push` skill](../../html-plan-push/SKILL.md) and follow it directly. Do not invoke the local `html-plan` adapter again.

A push updates a mutable draft. It does not publish a numbered version or authorize implementation. On a private Tailscale host, every reader who can reach the host can read every draft. Network reachability is the access boundary. The host does not prove a reader's individual identity or authorship.

## Gate implementation and preserve the record

Summarize the settled direction in chat and wait for explicit authorization such as "implement it" or "ship it." Discussion, a browser view, and a draft push are not authorization.

Approval freezes the plan. Keep progress, test output, and blockers in the session or pull request, not in the plan. Reopen the file only when the user revises a decision or when the work lands. The closing update records what shipped, where implementation diverged from the plan and why, and whether flagged risks occurred.

Completion criterion: implementation starts only after explicit approval, the plan never becomes a tracker, and the final record states how the shipped result differed from the approved plan.
