# Open or refresh without stealing focus

How `open` and `refresh` behave inside Cmux and outside it, and what happens when the plan surface has been closed or duplicated.

On first creation, on explicit `/html-plan`, or when the user asks to reopen the plan:

```bash
bun "<installed-html-plan-skill>/scripts/html-plan.ts" open --file "<absolute-plan-path>"
```

Inside Cmux, the helper identifies the invoking caller and explicitly targets that caller's workspace, surface, and window. It marks the plan tab with a path-derived identity, reuses it after link navigation, and on explicit open replaces a stale copy from a previous workspace rather than duplicating it. Outside Cmux, it opens the file in the default browser without activating the browser where the platform supports background opening.

After every material update:

```bash
bun "<installed-html-plan-skill>/scripts/html-plan.ts" refresh --file "<absolute-plan-path>"
```

`refresh` resolves the marked plan surface across Cmux workspaces, returns it to the plan URL after link navigation, closes stale duplicate surfaces, and reloads the kept surface in place. If no marked or matching surface exists, the pane is treated as closed and stays closed; file updates continue and `/html-plan` reopens it later.

Completion criterion: the plan is current; opening or refreshing created no duplicate pane and did not move focus away from the invoking session.
