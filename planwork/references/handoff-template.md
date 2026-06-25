# HANDOFF.md template

The `HANDOFF.md` is the self-contained scope + context document for a plan. It is
the *distilled conclusion* of `context.md`. The implementing agent sees only this
file and the task ledger — never the planning conversation.

Tasks themselves do **not** live here. They go into the ledger via
`taskman create-plan --tasks '[…]'` (each task gets a `t-NNN` id). This file gives
the implementer everything needed to work those tasks: real code state, exact
signatures, ordering, patterns, and a verification gate per task archetype.

Write it to `.plans/<plan-name>/HANDOFF.md`, then:

```bash
taskman create-plan --name <plan-name> --title "<Title>" \
  --handoff-file .plans/<plan-name>/HANDOFF.md \
  --tasks '[{"description":"<task 1>"},{"description":"<task 2>"}]'
```

---

````markdown
# <Plan title>

## Goal
One sentence: what the implementing agent should achieve.

## Context
- Parent PRD / issue reference.
- Initiative + sibling plans this depends on (and whether they're done).
- Module root path.
- `base_commit: <git sha>` — optional, enables the drift check in execution.

## What exists
The ACTUAL current state of the code on disk right now — not what was planned.
Document the real file tree, the real signatures, the real state shape.

## API inventory
For every class, function, or type the agent will use, the exact signature:

```ts
// src/foo/bar.ts
export function doThing(input: ThingInput): Promise<ThingResult>
export interface ThingInput { id: string; force?: boolean }
```

The agent should never have to explore source to discover the API.

## Tasks (mirror of the ledger)
The implementer works `t-NNN` from `taskman status`. For each, record here the
detail the one-line ledger description can't hold:

- **t-001 — <title>** — exact file path to create/modify, what to add (state
  fields, component structure, endpoint logic), code sketches where wiring is
  non-obvious.
  - **Verify:** `<command>` → `<expected output>`
- **t-002 — <title>** — …
  - **Verify:** `<command>` → `<expected output>`

## Files to create
- `path/to/new-file.ts` — <what it is>

## Files to modify
- `path/to/existing.ts` — <summary of the change>

## Testing notes
What to test, which patterns to follow, prior-art references.

## Patterns to follow
- `src/components/FooBar.tsx:40-85` — the pattern to match for <X>.
````

---

## Quality checklist (before `taskman create-plan`)

- [ ] "What exists" reflects the REAL codebase, not a sibling plan's planned output.
- [ ] Every API method the agent needs has its full signature.
- [ ] State-shape changes shown as typed interfaces.
- [ ] File paths are exact, not approximate.
- [ ] No task assumes a sibling plan that might not be done yet.
- [ ] Patterns reference specific files + line ranges, not generic advice.
- [ ] Each task archetype has a verification gate (command + expected output).
- [ ] The `--tasks` list maps 1:1 to the task sections documented here.
