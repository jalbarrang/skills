---
name: subagents
description: Spawn specialized subagents (scout, docs-scout, planner, worker, reviewer, validator, bug-prover, advisor, ux-designer) via pi or cursor-agent backends, singly or in parallel. Use when the user says spawn, fan out, parallelize, second opinion, isolated investigation, or wants scout/reviewer/worker/planner/advisor help without polluting the main thread.
---

# subagents

Self-contained orchestration skill. Agent prompts live in `agents/*.md`. Scripts spawn real `pi` or `cursor-agent` processes with isolated context.

## Setup

1. Install at least one backend on PATH and log in:
   - `pi` — OpenAI/Anthropic/etc models (`pi --help`, then auth for your providers)
   - `cursor-agent` — Cursor models (`cursor-agent login`)
2. Model routing follows `~/.agents/AGENTS.md` when present (intelligence / taste / cost table). Agent frontmatter supplies defaults; `--model` / `--thinking` override per call.
3. Optional defaults in `.agents/subagents.json` or `~/.agents/subagents.json`:

```json
{ "timeout": 600 }
```

`timeout` is seconds (default 600). Backend selection: model starting with `cursor:` → `cursor-agent`; anything else → `pi`.

## Scripts

Run from any cwd as `node <skill-dir>/scripts/<name>.mjs …`.

| Script | Usage |
|--------|--------|
| `spawn.mjs` | `node <skill>/scripts/spawn.mjs --agent <name> --task <text> [--model <m>] [--thinking <t>] [--cwd <dir>] [--timeout <sec>]` |
| `parallel.mjs` | `node <skill>/scripts/parallel.mjs --tasks <file.json\|inline JSON>` |

`parallel.mjs` expects a JSON array of `{ agent, task, model?, thinking?, cwd?, timeout? }`. Results print under `## <agent> · <model>` in completion order; final line is `N succeeded / M failed` (nonzero exit if any failed).

## Agents

| Agent | Role |
|-------|------|
| `scout` | Fast codebase recon for handoff |
| `docs-scout` | Library/framework docs recon |
| `planner` | Implementation plan (read-only) |
| `worker` | Full-capability implementation |
| `reviewer` | Fresh-context quality/security review |
| `validator` | Confirm or falsify one claim |
| `bug-prover` | Minimal failing repro artifact |
| `advisor` | Focused second opinion |
| `ux-designer` | Anti-AI-aesthetic UI guidance |

## Core rules

1. Parallelize discovery and verification, not conflicting edits.
2. Prefer one `worker` unless file ownership is clearly partitioned.
3. Route each task to the model whose strengths match the work; name the model in reports.
4. Deep orchestration patterns: see [reference/orchestration.md](reference/orchestration.md).
