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

- **code-reviewer** — Bug-focused review driven by a per-project context.
  `init` interviews your repo and writes `.code-reviewer/context.md` (the
  invariants, intentional patterns, and bug classes that make review sharp);
  `review` runs a context-aware discovery pass plus a skeptical verifier and
  reports tiered findings; `learn` folds each wrong call back into the context
  (anti-rot); `status` checks context health.

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

## Writing & Docs

Turn changes and decisions into clear, scannable artifacts.

- **write-pr** — Write concise, high-signal pull request descriptions with
  mermaid diagrams. Best for architectural, contract, data-flow, or
  state-machine changes where a diagram beats prose.

  ```
  npx skills@latest add jalbarrang/skills/write-pr
  ```

- **write-an-adr** — Create Architecture Decision Records. Compact by default
  (title + summary), extended Nygard format when the decision warrants it.

  ```
  npx skills@latest add jalbarrang/skills/write-an-adr
  ```

- **write-context-file** — Create or maintain project context files
  (`AGENTS.md`, `CLAUDE.md`) using the anti-rot principle: durable invariants
  with single owners, no drift-prone inventories.

  ```
  npx skills@latest add jalbarrang/skills/write-context-file
  ```

- **changelog-announce** — Generate Slack-friendly changelog announcements from
  git diffs or described changes. Non-technical, copy-paste ready.

  ```
  npx skills@latest add jalbarrang/skills/changelog-announce
  ```

- **write-a-skill** — Author new agent skills with proper structure, progressive
  disclosure, and bundled resources.

  ```
  npx skills@latest add jalbarrang/skills/write-a-skill
  ```

## Services & Integrations

Talk to external services through dependency-free scripts — digest to stdout, full payload to a temp file.

- **jira** — View, search, and comment on Jira work items via the authenticated Atlassian CLI (`acli`). JQL search, ticket digests with full descriptions and comment threads written to temp files, `defaultProject` shorthand for bare ticket numbers.

  ```
  npx skills@latest add jalbarrang/skills/jira
  ```

- **slack** — Read Slack channels and threads, search the workspace, post/edit/delete bot messages, and download shared files via the Slack Web API. Plain `fetch`, cursor pagination, and rate-limit retry — needs `SLACK_BOT_TOKEN` (and `SLACK_USER_TOKEN` for search).

  ```
  npx skills@latest add jalbarrang/skills/slack
  ```

## Communication

- **adhd-mode** — Shape output for a reader with ADHD: lead with the next action,
  number multi-step work, externalize state across turns, suppress tangents, and
  make wins visible.

  ```
  npx skills@latest add jalbarrang/skills/adhd-mode
  ```
