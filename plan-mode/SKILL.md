---
name: plan-mode
description: Plan and execute non-trivial work through self-contained plan files. Use to turn a goal, PRD, or brainstorm into grounded .plan.md files that a fresh agent can implement, and to execute those plans task-by-task with drift checks and verification gates. Supersedes create-implementation-plans and implement-plan. Use when the user says plan, plan mode, write a plan, implement a plan, execute a plan, or work a plan.
---

# Plan Mode

Two phases. **Plan** turns intent into grounded, self-contained `.plan.md`
files. **Execute** works a plan file top-to-bottom with drift checks and
verification. Read the phase you need; you rarely need both in one turn.

Detailed conventions live in `references/`:
- `references/plan-template.md` — the exact `.plan.md` structure to emit.

---

## Phase 1 — Plan

Reach shared understanding *before* writing a plan. Do not write product code in
this phase.

### 1. Understand intent
Clarify the goal through dialogue. Push back on weak assumptions, name
trade-offs, and ask focused questions when a real choice exists. Don't formalize
until you and the user agree on the approach.

### 2. Investigate the codebase (read-only)
This is the highest-leverage step. A plan that describes what *should* exist
instead of what *does* exist will mislead the implementer. For every module the
work touches:
- Map the file tree — actual files, not assumptions.
- Read the public API — exported functions/classes/types and their exact signatures.
- Read state shape, components, and the server/API layer as relevant.
- Check the dependency manifest for what's available.

Never guess from file names. Read the real files.

### 3. Write the plan file(s)
Use `references/plan-template.md`. Name files `<id>_<slug>.plan.md` (e.g.
`docs/plans/`, or wherever the user prefers — ask if unclear). Key requirements:
- **Grounded** — the "What exists" section reflects the real codebase right now.
- **Self-contained** — the implementer has no access to this conversation;
  everything it needs is in the file.
- **API inventory** — full signatures for every method the implementer will call,
  so it never has to go spelunking.
- **Ordered todos** — frontmatter `todo` items map 1:1 to numbered body tasks,
  worked top-to-bottom.
- **Verification gate per task** — a concrete command and its expected output
  (e.g. `pnpm test` → all pass) so success is provable, not a judgement call.
- **Pattern references** — point to specific existing files + line ranges, not
  "follow project conventions".

### 4. Size the work
- **Bounded change, one session** → a single flat plan.
- **Large / multi-subsystem with dependencies** → split into several plan files
  and note ordering (which run in parallel, which are sequential).

### 5. Present
List the plans with name, overview, and task count. Flag parallel vs sequential
dependencies. Get sign-off before execution.

---

## Phase 2 — Execute

Implement a `.plan.md` file. Your only job is to work the tasks — don't explore
beyond what each task needs, and don't deviate silently.

### 1. Read the plan
Read the file in full. Parse the `todo` frontmatter. Find the first
`status: pending` item — that's the start.

### 2. Drift check (do this FIRST)
Plans go stale. If the plan records a base commit, run `git rev-parse HEAD`; if
it differs, run `git diff <base> --stat`, re-read any files the current task
touches, and adapt to what the code actually looks like now. This is a warning,
not a stop.

### 3. Read referenced context
Before writing code, read every file under **Patterns to follow** and **Files to
modify**, plus any referenced README/ADR/PRD. **Trust the code, not the plan** —
if signatures disagree, the code wins.

### 4. Work each todo, in order
For each item:
1. Set `status: in_progress` in the frontmatter.
2. Re-read files you're about to modify; confirm the plan's assumptions hold.
3. Implement — follow the referenced patterns, not generic conventions.
4. Run the task's verification gate (the command in the task / template).
5. Set `status: done`.

**Blocked** (missing dep, ambiguous requirement, design decision needed): leave
`status: pending`, note the blocker to the user, move to the next unblocked task.

**Discovered work** outside the plan: note it as a follow-up for the user to
review later. Do **not** implement it in this run.

### 5. Final verification
After all todos are done or blocked, run the project's typecheck, lint, and test
commands. Fix anything you broke before declaring done.

### 6. Report
Tell the user: which todos completed, which are blocked and why, and any
deviations from the plan with the reason.

---

## Key principles

- **Grounded, not aspirational** — read real files first; a plan against imagined
  code fails.
- **Self-contained** — the implementer sees only the plan file.
- **Encode the API surface** — the biggest time sink is discovering signatures;
  spell them out.
- **Ordered** — earlier todos build foundations for later ones; don't skip ahead.
- **Patterns, not principles** — cite `src/components/FooBar.tsx:40-85`, not
  "match conventions".
- **Read before writing** — never modify a file you haven't read this session.
