# Delegate the final pass to `plan-writer`

When to hand a settled plan to a presentation pass on Fable, what that pass may and may not change, and what to do when it is unavailable.

Maintain the plan yourself throughout scoping. A delegated child cannot follow a thread that is still moving, and the plan has to stay current between questions.

Once every material decision is settled, and before you summarize for approval, hand the finished plan to one Fable subagent for a design and clarity pass. Give it the absolute project root and plan path with this prompt:

> Design and clarity pass on the HTML plan at `<absolute-plan-path>`. Presentation only. Do not add, remove, reorder in substance, or reinterpret any decision, constraint, or open question. Never invent rationale, alternatives, or evidence that is not already on the page. Apply the content rules in `references/writing-the-plan.md` of the installed `html-plan` skill and preserve every required behavior listed there. Report what you changed. List separately any claim asserted without its reasoning, any term used without definition, and any routine filler that should come off the page.

The hop is worth it because its job is presentation while yours was judgment. It reads the page as the user will, without the thread in its head, so it catches the shorthand, the unexplained term, and the flattened hierarchy that are invisible to you by the end of a scoping session. Its remit stops at presentation: the decisions are already settled, and a polish pass is not a place to relitigate them. What it cannot fix is a consequential claim that arrived on the page with no evidence behind it, since supplying that evidence would mean inventing it. Expect those back as a list, and answer them yourself from the thread and the codebase before the plan goes up for approval.

Skip the delegation when the plan is short enough that a second pass would not change how it reads, or when the user is waiting on a fast turnaround and the page already reads well.

If Fable is unavailable, do the pass yourself, rereading the plan as someone who was not in the conversation. Do not retry automatically or silently substitute another model.

When it returns, confirm the plan remains read-only and includes the absolute artifact path and pre-approval labeling. Then refresh the surface.

Completion criterion: the plan the user is asked to approve has had a presentation pass, and its substance is identical to what was settled in chat.
