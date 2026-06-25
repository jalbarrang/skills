# Mode: planning-context

`context.md` is the living written record of a planning conversation. It exists
to slow the jump from "read the codebase" to "create the plan" — the moment where
reasoning usually gets lost. Write it as you think, not as an afterthought.

## When to load this

From the first real decision onward in Phase 1. If you have read code and formed
an opinion but written nothing down, that is the signal to update `context.md`.

## What it is

`.plans/<plan-name>/context.md` — a deliberation document, **not** the plan. It
captures the *why* and the *roads not taken*, which `HANDOFF.md` and the task
list deliberately omit.

## Process

### 1. Create it early
As soon as you understand the intent, write `.plans/<plan-name>/context.md` with
the `write` tool. Do not wait until you are ready to create the plan.

### 2. Keep these sections current
- **Intent** — what the user actually wants, in their terms.
- **Decisions** — choices made and the reasoning behind each.
- **Constraints** — technical, product, or process limits shaping the work.
- **Open questions** — anything unresolved; do not finalize a plan with silent unknowns.
- **Discarded options** — approaches considered and rejected, with why. Highest-value
  section and the one most often skipped.

### 3. Style
Tight and professional, no filler. Bullets over prose. Update in place as
understanding shifts — do not append a changelog.

### 4. Use it before finalizing
`context.md` is the *input* to the plan, not a duplicate of it. Before running
`taskman create-plan`, re-read it: every open question resolved, every decision
justified. The HANDOFF is the distilled conclusion; `context.md` is the reasoning
that earned it.

## Initiatives

When the work is too large for one coherent session, or spans subsystems with
dependencies, decompose it into several plans under one initiative. Keep the
cross-plan deliberation (why this breakdown, the ordering, what each plan owns) in
the initiative's `INITIATIVE.md`; each member plan keeps its own `context.md`.
Use `taskman initiative-status <name>` to see which plans are ready to start.

## Relationship to prototypes

For visual work, an HTML prototype is the visual sibling of `context.md` — see
`references/visual-prototype.md`. Both are deliberation artifacts. Written
reasoning lives here; visual reasoning lives in the prototype.
