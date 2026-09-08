# Resolve the project-local plan path

What counts as a valid project root for a plan, how `resolve` decides the directory, and the file conventions that follow once a path is chosen.

Inspect the work and identify the specific persistent project root before choosing a location. Do not use `$HOME`, a shared repositories container, a Git worktree, or the vault root when the task belongs to a nested project. If existing HTML plans have a natural nonstandard home inside the project, pass it explicitly with `--plan-dir`; otherwise the helper checks only `<project>/docs/plans/` and `<project>/plans/`, then falls back to `<project>/docs/plans/<topic>.html`.

```bash
bun "<installed-html-plan-skill>/scripts/html-plan.ts" resolve \
  --project-root "<absolute-target-project-root>" \
  --slug "<stable-topic-slug>"
```

The pure `resolve` command returns JSON containing `projectRoot`, `directory`, `file`, and `convention` without creating anything. `--project-root` is required and must contain `CLAUDE.md`, a real `.git` directory, or a project manifest; the helper rejects home, `~/.claude`, markerless roots, and Gitfile roots such as worktrees or submodules. When operating in a worktree, derive the persistent root from `git rev-parse --path-format=absolute --git-common-dir` and pass the parent of the common `.git` directory. If `resolve` used `--plan-dir`, pass the same option to `prepare`.

- Reuse the same file for the same planning thread.
- Keep HTML only; do not create a companion Markdown plan.
- Follow the project's version-control precedent. Never stage or commit the plan unless the user asks.
- Keep completed plans indefinitely.

Completion criterion: one stable absolute `.html` path has been selected for this thread.
