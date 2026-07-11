---
name: taskman
description: Drive the taskman CLI over a JSONL plan ledger (default .taskman/plans/, configurable via .taskmanrc) — create plans and initiatives, revise plans, track task status, and reconcile drift. Load when running taskman commands (create-plan, create-initiative, revise-plan, create-handoff, status, list, update-task, add-task, reconcile, close, root), tracking plan/task progress across sessions or harnesses, or inspecting a plan ledger directory. Covers the status-is-a-projection model, stateless plan resolution, ledger-root discovery, and reconcile semantics.
---

# taskman

`taskman` manages plan/task state on disk under a plans root (default `.taskman/plans/`) so planning agents keep durable progress across sessions and harnesses. Install: `npm i -g @dreki-gg/taskman` or prefix commands with `npx @dreki-gg/taskman`.

The command and flag inventory is **not** reproduced here — it lives in `--help`, which is always current for the installed version:

```bash
taskman --help            # all commands
taskman <command> --help  # flags + arguments for one command
```

This skill teaches what `--help` cannot: the data contract and the three invariants that decide whether a command does what you expect. For the planning/execution *methodology* (when to plan, verification gates, execution discipline), load the `planwork` skill — this one is only the CLI's contract.

## The ledger

Everything is plain JSONL/Markdown under the plans root — `.taskman/plans/` in the current directory by default:

- `<root>/plans.jsonl` — plan registry
- `<root>/initiatives.jsonl` — initiative registry (initiatives group plans)
- `<root>/<plan>/tasks.jsonl` — one plan's tasks (first line is metadata)
- `<root>/<plan>/HANDOFF.md`, `<root>/<initiative>/INITIATIVE.md` — prose

### Discovering the root

Run `taskman root --json` (`{ plans_root, source, absolute }`) before assuming any ledger path. A `.taskmanrc` JSON file in the working directory relocates the ledger: `{"plans-root": "some/dir"}` means `some/dir/plans.jsonl` — the value IS the ledger folder. Resolution is cwd-only: no directory walk-up, no env var.

## Invariants (read before acting)

1. **Status is a projection of task state, not a manual flag.** A plan becomes `done` when its active tasks are all resolved and no follow-ups remain; an initiative becomes `done` when every member plan is terminal. `update-task` re-derives the registry automatically.
2. **Plan resolution is stateless.** A command targets a plan via `--plan <name>` (any directory prefix is stripped, so a full ledger path works too), else the *single* in-progress plan. Ambiguous or missing → non-zero exit listing the candidates.
3. **Manual terminal statuses are never auto-reverted.** `reconcile` only moves `in-progress ⇄ done`; it never resurrects a `superseded`/`abandoned` plan or regresses a finished one.

## Core patterns

### Execution loop

```bash
taskman status                  # active plan + task ids/statuses
taskman update-task t-003 done --plan my-plan --notes "what was done"
taskman add-task "handle empty input" --reason "found gap while implementing"
taskman reconcile --apply       # repair safe (in-progress→done) drift
```

### Creating initiatives and plans

The CLI creates the same durable artifacts as any other ledger writer, so a plan or initiative created here is indistinguishable from one created elsewhere. Handoff/overview/task payloads accept an inline value, a `--*-file <path>`, or piped stdin (`-`).

```bash
taskman create-initiative --name auth-overhaul --title "Auth overhaul" --overview-file -
taskman create-plan --name add-login --title "Add login" --initiative auth-overhaul \
  --handoff-file HANDOFF.md --tasks '[{"description":"do it"}]'   # tasks get t-NNN ids
taskman create-handoff --plan add-login --file HANDOFF.md          # write/replace prose
```

Use `--depends-on a,b` on create-plan for plan-level ordering. Task creation here is plan setup — distinct from `add-task`, which records a *deferred* follow-up (see Common mistakes).

### Revising a plan in place

```bash
taskman revise-plan --plan add-login --title "New title" --tasks-file tasks.json
```

Every content field is optional — omitted title/handoff/tasks are preserved. When `--tasks` is passed, the new array fully replaces the task set, but **status and notes are preserved for any task whose id is unchanged**. `--initiative` / `--depends-on` re-link when passed.

### Machine-readable output

Every command prints human text by default and accepts `--json`:

```bash
taskman status --json   # { active, plan_name, title, total, counts, task_ids }
taskman list --json     # array of plan items
```

## Common mistakes

### HIGH — Setting plan status by hand to mark progress

`taskman close done` on a plan with open tasks will be re-opened the moment another task write reconciles the registry. `close` is for `superseded`/`abandoned`. For normal completion, resolve the tasks — `done` is derived.

### HIGH — Assuming a bare command finds any plan

With no `--plan`, resolution only succeeds when exactly one plan is `in-progress`. A just-completed plan is `done`, so it drops out of resolution and a bare command exits non-zero — pass `--plan` explicitly, especially on writes.

### MEDIUM — Treating reconcile as a force-sync in both directions

`reconcile --apply` only performs the safe upgrade (`in-progress → done`). A `done` plan with unfinished tasks is *reported* as downgrade drift, never auto-fixed — resolve it by marking the tasks, not by forcing status.

### MEDIUM — Expecting add-task to queue active work

`add-task` records a `deferred`, discovered follow-up for later triage — not an active to-do. It does not become pending automatically, and it keeps the plan non-finalizable until resolved.
