---
name: workflows
description: Design, validate, and run bounded multi-agent workflows from any harness with a shell — Cursor, Codex, pi, or anything that supports .agents/. Declarative JSON chains of sequential agent steps, static parallel groups, and bounded fan-out (maxItems, ≤100 agents), executed by spawning harness CLIs (pi, codex, cursor-agent) as subagent runners. Supports foreground and background runs, status inspection, stop, resume with completed-phase reuse, and saved reusable chains. Use when the user says design a workflow, run a workflow, fan out subagents, parallelize agents, orchestrate agents, workflow chain, background agent run, or workflow status.
---

# workflows

Bounded, declarative multi-agent orchestration as plain scripts. A workflow is a JSON chain of phases — a single agent step, a static parallel group, or a bounded fan-out over an earlier phase's JSON output — validated before anything runs, with a statically known worst-case agent count. This is a harness-agnostic port of pi-plan-mode's `/workflow` system: the design loop, format, and limits are identical, but execution spawns harness CLIs directly, so it works from Cursor, Codex, pi, or any harness that can run Node. (Claude Code has native workflows — don't install this there.)

Read `reference/format.md` before writing your first workflow JSON; it owns the full format, templating, and config documentation.

## Setup

1. Node ≥ 20 (`node --version`).
2. The `pi` CLI on PATH — the only CLI required by default, since `pi` is the default runner. `codex`, `cursor-agent`, and `claude` runner templates are built in but entirely optional: a CLI is needed only when a step's runner actually selects it, and `run.mjs` preflights every selected runner before spawning anything, failing fast with an actionable message instead of dying mid-run.
3. Agent definitions: each agent referenced by a workflow is a markdown file in `.agents/subagents/<name>.md` (project) or `~/.agents/subagents/<name>.md` (user) — flat YAML frontmatter (`name`, `description`, `model`, `thinking`, `runner`), body is the system prompt. A workflow that references an undefined agent fails validation at dry-run/run time with the list of available agents.
4. Optional config in `.agents/workflows.json` (project, walk-up) or `~/.agents/workflows.json`:

```json
{
  "defaultRunner": "pi",
  "timeoutMinutes": 20,
  "runners": {
    "pi-sandboxed": ["pi", "-p", "--no-session", "--model", "{model}", "{prompt}"]
  }
}
```

## The loop: design → validate → approve → run

1. **Design.** Investigate the task, then draft the workflow JSON (see `reference/format.md`). Prefer one mutation-capable worker at a time; parallel agents should be independent readers, reviewers, or isolated-worktree tasks. Every fan-out must declare `maxItems`.
2. **Validate.** `node <skill-dir>/scripts/validate.mjs my-workflow.json` — fix every error before showing the user anything.
3. **Approve.** ALWAYS show the user the exact validated JSON, the phase list, and the maximum agent count, and get explicit approval before running. Never launch a workflow the user has not seen.
4. **Run.** `node <skill-dir>/scripts/run.mjs my-workflow.json` (foreground) or `--background` (detached; prints a run id). Use `--dry-run` first to see every resolved command without spawning anything.

## Commands

| Command | Purpose |
|---------|---------|
| `node scripts/validate.mjs <file\|chain>` | Validate; print phase digest + max agent count |
| `node scripts/run.mjs <file\|chain> [--dry-run] [--background] [--runner <name>]` | Execute a workflow |
| `node scripts/run.mjs --resume <run-id> [--background]` | Resume a stopped/failed run, skipping completed phases |
| `node scripts/status.mjs` | Table of all runs |
| `node scripts/status.mjs <run-id>` | One run: phases, output files, error |
| `node scripts/status.mjs --stop <run-id>` | Terminate a running workflow |

Run state lives in `.agents/workflow-runs/<run-id>/` (state.json + per-phase output files + runner.log for background runs). Resume reuses persisted outputs of completed phases — an upgrade over pi's restart-from-scratch resume.

## Saved chains

A reviewed workflow saved as `<name>.chain.json` is reusable by bare name: `node scripts/run.mjs <name>`. Search order: project `.agents/chains/`, project `.pi/chains/` (pi-plan-mode compatible), `~/.agents/chains/`, `~/.pi/agent/chains/`. To save one, copy the approved JSON into one of those directories.
