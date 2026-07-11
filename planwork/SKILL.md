---
name: planwork
description: Plan and execute non-trivial work through the taskman plan ledger. Use to turn a goal, PRD, or brainstorm into a grounded, self-contained plan a fresh agent can implement, then work it task-by-task with drift checks and verification gates. Harness-agnostic — state lives in `.plans/` via the taskman CLI, not in editor-specific todo files. Use when the user says plan, plan it, write a plan, implement a plan, execute a plan, or work a plan.
---

# planwork

Two phases. **Plan** turns intent into a grounded, self-contained plan in the
`.plans/` ledger. **Execute** works that plan top-to-bottom with drift checks and
verification gates. Read the phase you need; you rarely need both in one turn.

Plan and task state is **durable and harness-agnostic**: it lives under `.plans/`
and is driven by the `taskman` CLI, never by an editor's native todo panel or an
improvised `.plan.md` file. Any agent with a shell produces the same ledger.

> Requires the `taskman` CLI on PATH (`taskman --version`). If missing, prefix
> commands with `npx @dreki-gg/taskman`. See the `taskman` skill for the full
> command and flag inventory.

## Modes (references bridge)

`SKILL.md` is the router. Load a mode file only when its trigger fires — keep the
entry point small.

| Load this | When |
|-----------|------|
| `references/planning-context.md` | The moment you form an opinion in Phase 1 — maintain `context.md` deliberation. |
| `references/visual-prototype.md` | The work changes UI / layout / styling — force-write an HTML prototype. |
| `references/handoff-template.md` | You are about to write a plan's `HANDOFF.md`. |
| `references/execution-discipline.md` | You are executing or delegating tasks, or closing out a plan — gates, scoping, reconcile, discovered work. |

---

## Phase 1 — Plan

Reach shared understanding *before* writing a plan. Do not write product code in this phase — the only files you may create or modify are under `.plans/` (context.md, prototypes) until the plan is approved. Where the harness has a native planning mode (Cursor's Plan mode, Claude Code's plan mode), run Phase 1 inside it so the read-only discipline is enforced, not just promised.

### 1. Understand intent
Clarify the goal through dialogue. Push back on weak assumptions, name trade-offs, ask focused questions when a real choice exists. Batch clarifications: at most 5 questions in one message, each with enumerated options (and a free-form escape) so the user can answer in seconds — never drip one question per turn. As soon as you form
an opinion, start a deliberation record — load `references/planning-context.md`
and keep `.plans/<plan>/context.md` current.

### 2. Investigate the codebase (read-only)
Highest-leverage step. A plan that describes what *should* exist instead of what
*does* exist will mislead the implementer. For every module the work touches:
- Map the real file tree — actual files, not assumptions.
- Read the public API — exported functions/classes/types and exact signatures.
- Read state shape, components, and the server/API layer as relevant.
- Check the dependency manifest for what's available.

Never guess from file names. Read the real files.

### 3. Prototype, if visual
If the work changes how anything looks or behaves visually, load
`references/visual-prototype.md` and write an HTML prototype to
`.plans/_prototypes/<slug>.html` before finalizing. Get a reaction first.

### 4. Write the plan into the ledger
Distill `context.md` into a `HANDOFF.md` (load `references/handoff-template.md`)
and create the plan with `taskman`. Tasks live in the ledger, not in markdown
frontmatter:

```bash
taskman create-plan --name <plan-name> --title "Title" \
  --handoff-file .plans/<plan-name>/HANDOFF.md \
  --tasks '[{"description":"<concrete task>"},{"description":"<next task>"}]'
```

The HANDOFF must be **grounded** (real codebase, real signatures), **self-contained**
(the implementer never sees this conversation), and carry a **verification gate**
per task archetype. Tasks are **ordered** — earlier ones build foundations for later.

### 5. Size the work
- **Bounded change, one session** → a single flat plan.
- **Large / multi-subsystem with dependencies** → split into several plans under
  one initiative; order them by dependency. Use `taskman initiative-status
  <name>` to see which plans are *ready* (all dependencies done). Keep cross-plan
  reasoning in the initiative's `INITIATIVE.md`; each plan keeps its own `context.md`.

### 6. Present
List the plans with name, overview, and task count (`taskman status --plan
<name>`). Flag parallel vs sequential dependencies. Get sign-off before execution.

---

## Phase 2 — Execute

Work a plan from the ledger. Your only job is to work the tasks — don't explore
beyond what each task needs, and don't deviate silently.

### 1. Orient
```bash
taskman list                       # plans in this repo
taskman status --plan <plan-name>  # task ids + progress
```
Read `.plans/<plan-name>/HANDOFF.md` in full (and `INITIATIVE.md` if linked).
The first `pending` task is the start.

### 2. Drift check (do this FIRST)
Plans go stale. If the HANDOFF records a base commit, run `git rev-parse HEAD`;
if it differs, run `git diff <base> --stat`, re-read the files the current task
touches, and adapt to what the code actually looks like now. Warning, not a stop.

### 3. Read referenced context
Before writing code, read every file the HANDOFF cites under **Patterns to
follow** and **Files to modify**, plus any referenced README/ADR/PRD. **Trust the
code, not the plan** — if signatures disagree, the code wins.

### 4. Work each task, in order
For each `pending` task:
1. Re-read the files you're about to modify; confirm the HANDOFF's assumptions hold.
2. Implement — follow the cited patterns, not generic conventions.
3. Run the task's verification gate.
4. Mark done **only after the gate passes**:
   ```bash
   taskman update-task --plan <plan-name> t-00N done --notes "brief proof: lint/typecheck/test"
   ```

**Blocked** (missing dep, ambiguous requirement, design decision needed):
```bash
taskman update-task --plan <plan-name> t-00N blocked --notes "why + what decision is needed"
```
Then move to the next unblocked task.

**Discovered work** outside the plan — defer it, don't do it now:
```bash
taskman add-task --plan <plan-name> "short label" --reason "gap found while doing t-00N"
```

### 5. Final verification
After all tasks are done or blocked, run the project's typecheck, lint, and test commands. Fix anything you broke before declaring done. Then `taskman reconcile` (read-only) to confirm registry and task state agree — see `references/execution-discipline.md` before ever passing `--apply`.

### 6. Report
```bash
taskman status --plan <plan-name>
```
Tell the user: N/M done, which tasks are blocked and why, any deviations and the reason.

---

## Key principles

- **Grounded, not aspirational** — read real files first; a plan against imagined
  code fails.
- **Self-contained** — the implementer sees only the HANDOFF and the ledger.
- **Harness-agnostic state** — plan/task lifecycle lives in `.plans/` via taskman,
  never an editor's native todo file.
- **Encode the API surface** — the biggest time sink is discovering signatures;
  spell them out in the HANDOFF.
- **Ordered** — earlier tasks build foundations for later ones; don't skip ahead.
- **Patterns, not principles** — cite `src/components/FooBar.tsx:40-85`, not
  "match conventions".
- **Read before writing** — never modify a file you haven't read this session.
- **Gate before done** — a task is `done` only after its verification gate passes.
