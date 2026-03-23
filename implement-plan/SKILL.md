---
name: implement-plan
description: Implement a `.plan.md` file by working through its todo items in order, updating frontmatter status as each task completes. Use when user wants to implement a plan, delegate a plan, execute a plan file, work a plan, or mentions "implement plan".
---

# Implement Plan

Execute a `.plan.md` file produced by the `create-implementation-plans` skill. Work through each frontmatter todo item top-to-bottom, updating status as you go.

## Configuration

Before using this skill, define the verification commands for your project. Replace the placeholders below with the actual commands:

```
typecheck: pnpm -r --if-present typecheck
lint:      pnpm -r --if-present lint
test:      pnpm -r --if-present test
```

These commands are run during step 4 (Final verification) and after individual todos when they have testable behavior.

## Input

The user provides a path to a `.plan.md` file. If the path is ambiguous, list available plans and ask the user to pick one.

## Workflow

### 1. Read the plan

- Read the `.plan.md` file in full.
- Parse the YAML frontmatter to extract the `todo` list.
- Identify the first todo with `status: pending` — this is your starting point.

### 2. Read referenced context

Before writing any code:

- [ ] Read every file listed under **Patterns to follow** in the plan.
- [ ] Read every file listed under **Files to modify**.
- [ ] Read any README, ADR, or documentation the plan references.
- [ ] If the plan references a parent PRD or issue, read it for broader context.

You need to understand the codebase as it exists _right now_, not as the plan describes it. If the plan's "What exists" section is stale, trust the actual files.

### 3. Implement each todo

For each todo item, in order:

1. **Update status** — set `status: in_progress` in the plan's frontmatter.
2. **Read before writing** — re-read any files you're about to modify. Confirm the plan's assumptions still hold.
3. **Implement** — make the changes described in the task. Follow the patterns the plan references, not generic conventions.
4. **Verify** — if the task has testable behavior, run relevant tests.
5. **Update status** — set `status: done` in the plan's frontmatter.

If a task is blocked (missing dependency, ambiguous requirement, design decision needed):

- Set `status: pending` and leave it.
- Add a note explaining the blocker in your response to the user.
- Move to the next unblocked task if possible.

### 4. Final verification

After all todos are done (or all remaining are blocked):

- [ ] Run the `typecheck` command from the Configuration section.
- [ ] Run the `lint` command from the Configuration section.
- [ ] Run the `test` command from the Configuration section (if tests exist for the changed code).
- [ ] Fix any errors you introduced before marking the final todo as done.

### 5. Report

Tell the user:

- Which todos were completed.
- Which todos are blocked, and why.
- Any deviations from the plan (and why they were necessary).

## Rules

- **Work top-to-bottom.** Todo items are ordered intentionally — earlier items create foundations for later ones.
- **Read before writing.** Never modify a file you haven't read in this session. Plans can go stale.
- **Trust the code, not the plan.** If the plan says a function has signature `foo(a: string)` but the actual code says `foo(a: string, b?: number)`, trust the code.
- **Don't skip ahead.** Finish or block each todo before starting the next.
- **Use Context7 MCP for dependency docs.** If you need documentation on a library or dependency, look it up rather than guessing.
