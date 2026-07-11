# Agent Skills

A collection of agent skills that extend capabilities across planning,
development, and tooling. Install any skill with:

```
npx skills@latest add jalbarrang/skills/<name>
```

## Global agent instructions

`_global/AGENTS.md` is the canonical cross-harness instruction file (prose formatting, model routing policy, output shaping). One command symlinks it into every harness's global mount point (`~/.agents/AGENTS.md`, `~/.pi/agent/AGENTS.md`, `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`):

```
node _global/install.mjs          # symlink into detected harnesses (--dry-run to preview)
```

Edit the repo file; every harness sees the change immediately. Cursor is the one exception — its global User Rules have no file mount, so paste the content into Cursor → Settings → Rules once.

The content is **my personal config** — the model table reflects my subscriptions and the output shaping reflects how I read. If you want this pattern with your own opinions, fork the repo (or just copy `install.mjs`) and replace `AGENTS.md` with yours; the installer doesn't care what's in the file.

## Planning & Design

Think through problems before writing code.

- **planwork** — Turn a goal, PRD, or brainstorm into a grounded, self-contained
  plan in the harness-agnostic taskman ledger (default `.taskman/plans/`, via
  the `taskman` CLI), then
  execute it task-by-task with drift checks and verification gates. Unifies plan
  creation and implementation; references-folder modes cover deliberation
  (`context.md`) and visual prototypes.

  ```
  npx skills@latest add jalbarrang/skills/planwork
  ```

- **taskman** — The plan ledger CLI's data contract (default `.taskman/plans/`, configurable via `.taskmanrc`): status-as-projection, stateless plan resolution, ledger-root discovery, reconcile semantics, and the common mistakes that corrupt plan state. Companion to planwork.

  ```
  npx skills@latest add jalbarrang/skills/taskman
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

- **commit** — Inspect changes, stage only related files, and write Conventional Commits messages. Never bundles unrelated work; never pushes unless asked.

  ```
  npx skills@latest add jalbarrang/skills/commit
  ```

- **context7** — Fetch current, version-accurate library docs from Context7 before coding against a third-party API, with a persistent local cache and raw-document retrieval by docRef.

  ```
  npx skills@latest add jalbarrang/skills/context7
  ```

- **subagents** — Spawn isolated subagents (scout, reviewer, worker, and 6 more) on the pi or cursor-agent backends, with model routing, single spawns, and parallel fan-out.

  ```
  npx skills@latest add jalbarrang/skills/subagents
  ```

- **browser** — Web search (DuckDuckGo/Google CSE/Brave), page-to-markdown extraction, and interactive browsing, screenshots, and console capture via the `agent-browser` CLI.

  ```
  npx skills@latest add jalbarrang/skills/browser
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

- **discord** — Read Discord guild channels and message history and download attachments via bot-token REST. ToS-safe reads only — needs `DISCORD_BOT_TOKEN`.

  ```
  npx skills@latest add jalbarrang/skills/discord
  ```

- **datadog** — Search Datadog logs and RUM events through the HTTP API. Digest to stdout, full JSON events to a temp file — needs `DD_API_KEY` + `DD_APP_KEY`.

  ```
  npx skills@latest add jalbarrang/skills/datadog
  ```

- **firestore** — Read-only Firestore access (collections, filtered queries, gets, counts, relation mapping) via the published `@dreki-gg/firestore-cli`.

  ```
  npx skills@latest add jalbarrang/skills/firestore
  ```

## Communication

- **adhd-mode** — Shape output for a reader with ADHD: lead with the next action,
  number multi-step work, externalize state across turns, suppress tangents, and
  make wins visible.

  ```
  npx skills@latest add jalbarrang/skills/adhd-mode
  ```
