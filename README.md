# Agent Skills

A collection of agent skills that extend capabilities across planning,
development, and tooling. Install any skill with:

```
npx skills@latest add jalbarrang/skills/<name>
```

## Planning & Design

Think through problems before writing code.

- **planwork** — Turn a goal, PRD, or brainstorm into a grounded, self-contained
  plan in the harness-agnostic `.plans/` ledger (via the `taskman` CLI), then
  execute it task-by-task with drift checks and verification gates. Unifies plan
  creation and implementation; references-folder modes cover deliberation
  (`context.md`) and visual prototypes.

  ```
  npx skills@latest add jalbarrang/skills/planwork
  ```

## Coding & Implementation

- **code-reviewer** — Multi-pass code review: parallel discovery, majority
  voting, skeptical verification. Finds bugs and inconsistencies in your latest
  changes.

  ```
  npx skills@latest add jalbarrang/skills/code-reviewer
  ```

- **ast-grep** — Structural (AST-based) code search and rewrite via the
  `ast-grep` CLI. Match code by shape and run mechanical refactors.

  ```
  npx skills@latest add jalbarrang/skills/ast-grep
  ```

- **handoff** — Distill the current conversation into a self-contained prompt you
  can paste into a fresh chat. Lossless context transfer instead of compaction.

  ```
  npx skills@latest add jalbarrang/skills/handoff
  ```

## Tooling & Workflow

- **pr-babysitter** — Watch a PR's CI checks until they settle and surface new
  review/bot comments, using the `gh` CLI.

  ```
  npx skills@latest add jalbarrang/skills/pr-babysitter
  ```

- **context-folders** — Search and reference code in additional project folders
  outside the current workspace, by absolute path.

  ```
  npx skills@latest add jalbarrang/skills/context-folders
  ```
