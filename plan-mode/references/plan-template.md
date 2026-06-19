# `.plan.md` template

Copy this structure for each plan file. Frontmatter `todo` items map 1:1 to the
numbered tasks in the body. The implementing agent updates `status` as it works
(`pending` → `in_progress` → `done`).

````markdown
---
name: "<Short title>"
overview: "<1-2 sentence summary of what this slice does end-to-end>"
base_commit: "<git sha the plan was written against — optional but enables drift check>"
todo:
  - id: "<task>-1"
    task: "<Concrete task description>"
    status: pending
  - id: "<task>-2"
    task: "<Concrete task description>"
    status: pending
---

# <Plan title>

## Goal
One sentence: what the implementing agent should achieve.

## Context
- Parent PRD / issue reference.
- Dependencies on other slices (and whether they're done).
- Module root path.

### What exists
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

## Tasks
Numbered, ordered. Each task specifies:

1. **<Task 1 title>** — file to create/modify (exact path), what to add (state
   fields, component structure, endpoint logic), code sketches where wiring is
   non-obvious.
   - **Verify:** `<command>` → `<expected output>`
2. **<Task 2 title>** — ...
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

## Quality checklist (before handing a plan off)

- [ ] "What exists" reflects the REAL codebase, not a sibling task's planned output.
- [ ] Every API method the agent needs has its full signature.
- [ ] State-shape changes shown as typed interfaces.
- [ ] File paths are exact, not approximate.
- [ ] No task assumes a sibling task that might not be done yet.
- [ ] Patterns reference specific files + line ranges, not generic advice.
- [ ] Each task has a verification gate (command + expected output).
- [ ] Frontmatter `todo` items map 1:1 to the numbered body tasks.
