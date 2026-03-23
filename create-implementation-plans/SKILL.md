---
name: create-implementation-plans
description: Generate self-contained implementation plan files from project issues so that separate coding agents can implement each slice independently. Use when user wants to create plans, prepare work for delegation, write plan files, or mentions "implementation plans".
---

# Create Implementation Plans

Generate self-contained `.plan.md` files from project issues or task descriptions. Each plan contains enough context for a fresh coding agent to implement the slice without access to the orchestrator conversation.

## When to use

After tasks have been broken into implementable slices (via issues, a PRD, or verbal agreement), and before delegating implementation to other agent chats.

## Process

### 1. Gather the tasks

Ask the user which tasks need plans. These could be:
- Issue files in the repo (e.g., `docs/issues/`)
- A PRD with numbered sections
- A verbal list of slices from the current conversation

If the tasks reference a parent PRD or design doc, read it to understand the full scope.

### 2. Explore the current codebase

This is the most critical step. Plans that describe what *should* exist rather than what *does* exist will mislead the implementing agent.

For each module referenced by the tasks:

- **Map the file tree** — every file, not just the ones you expect
- **Read the public API** — for each source file, list exported classes, functions, types, and their signatures
- **Read the store shape** — if there's a state store, document every field and action
- **Read existing components** — what they render, what props they take, what hooks they use
- **Read the server/API layer** — every endpoint, its input schema, and what it does
- **Check dependencies** — what's in the dependency manifest that's relevant

Do NOT guess from file names. Read the actual files.

### 3. Write the plans

For each task, create a plan file. Use the naming convention `<id>_<slug>.plan.md` and place them where the user prefers (e.g., `docs/plans/`). Ask the user for the preferred location if unclear.

The plan has two parts: YAML frontmatter and a Markdown body.

#### Frontmatter

```yaml
---
name: "<Short title>"
overview: "<1-2 sentence summary of what this slice does end-to-end>"
todo:
  - id: "<task>-1"
    task: "<Concrete task description>"
    status: pending
  - id: "<task>-2"
    task: "<Concrete task description>"
    status: pending
---
```

Each `todo` item maps 1:1 to a numbered task in the body. The implementing agent updates `status` as it works (`pending` → `in_progress` → `done`).

#### Body structure

**Goal** — one sentence stating what the implementing agent should achieve.

**Context** — parent PRD/issue reference, dependencies on other slices, module root path. Then a **"What exists"** subsection documenting the ACTUAL current state of the code — not what was planned, but what's on disk right now.

**API inventory** — for each class, function, or type the agent will need to use, list the exact signature. The implementing agent should never have to go exploring source files to discover the API — the plan tells them everything.

**Tasks** — numbered, ordered steps. Each task specifies:
- Which file to create or modify (exact path)
- What to add (state fields, component structure, endpoint logic)
- Code sketches where the wiring is non-obvious

**Files to create** — explicit list of new files.

**Files to modify** — explicit list with a summary of what changes in each.

**Testing notes** — what to test, what patterns to follow, prior art references.

**Patterns to follow** — references to existing files that demonstrate the conventions the agent should match (with line numbers when helpful).

### 4. Quality checklist

Before presenting the plans to the user, verify each one against:

- [ ] The "What exists" section reflects the REAL codebase, not a previous task's planned output
- [ ] Every API method the agent needs is documented with its full signature
- [ ] State shape changes are shown as typed interfaces
- [ ] File paths are exact, not approximate
- [ ] The plan doesn't assume work from a sibling task that might not be done yet
- [ ] The plan references specific existing files for patterns, not generic advice
- [ ] The frontmatter todo items map 1:1 to the numbered tasks in the body

### 5. Present to the user

Show the user the list of plans created with their names, overviews, and task counts. Note which plans can run in parallel vs. which have sequential dependencies.

## Key principles

**Plans are grounded, not aspirational.** A plan written against imagined code will fail. Always read the real files first.

**Plans are self-contained.** The implementing agent has no access to the orchestrator conversation. Everything it needs must be in the plan file and any README or docs it references.

**Plans encode the API surface.** The biggest time sink for an implementing agent is discovering what methods exist and what their signatures are. Spell it out.

**Plans are ordered.** The todo items should be worked top-to-bottom. Earlier items create the foundation for later ones.

**Plans reference patterns, not principles.** Instead of "follow project conventions," say "see `src/components/FooBar.tsx` lines 40-85 for the pattern to follow."
