# Workflow format

A workflow is one JSON object:

```json
{
  "name": "fix-todos-fanout",
  "description": "Plan TODO fixes, fan out one worker per file, summarize.",
  "task": "Fix all TODO comments in the repository.",
  "agentScope": "both",
  "chain": [ ...phases ]
}
```

| Field | Rule |
|-------|------|
| `name` | kebab-case, starts with a letter, ≤ 63 chars (`^[a-z][a-z0-9-]{0,62}$`) |
| `description` | non-empty summary |
| `task` | the original task or a self-contained task statement — phases reference it as `{task}` |
| `agentScope` | optional: `project`, `user`, or `both` (default) — which `.agents/subagents/` scopes to search |
| `chain` | 1–32 phases; static worst case across all phases ≤ 100 agents |

## Phase kinds

**Agent step** — one subagent:

```json
{ "agent": "scout", "task": "List files for: {task}", "as": "plan", "label": "Plan", "model": "gpt-5.6-luna", "thinking": "low" }
```

`agent` and `task` are required. `as` names the output for later phases (identifier: `^[A-Za-z][A-Za-z0-9_-]*$`, unique across the workflow; `__proto__`/`constructor`/`prototype` are reserved). `model`/`thinking` override the agent definition's defaults.

**Static parallel group** — N independent agent steps at once:

```json
{ "label": "Recon", "concurrency": 2, "parallel": [ {agent step}, {agent step} ] }
```

`concurrency` is optional, 1–16, default 4. Children may each declare `as`.

**Bounded fan-out** — one agent per item of an earlier output's array:

```json
{
  "expand": { "from": "plan", "path": "/files", "item": "file", "maxItems": 8 },
  "parallel": { "agent": "worker", "task": "Fix {file.path}. Item: {item}" },
  "collect": { "as": "fixes" },
  "concurrency": 4
}
```

`from` must reference an earlier `as` output. `path` is an RFC 6901 JSON pointer (must start with `/`; `~1` decodes to `/`, `~0` to `~`). `maxItems` is mandatory — the run fails if the array is longer, and it counts toward the ≤ 100 agent budget. `collect.as` names the array of per-item outputs. If the referenced output is a string, the runner tries `JSON.parse` on it, then on its first fenced ```json block, before applying the pointer — so a planning agent can answer in prose-wrapped JSON.

## Task templating

Applied to every step's `task` at execution time, in this order:

| Placeholder | Replacement |
|-------------|-------------|
| `{task}` | the workflow-level `task` |
| `{previous}` | previous phase's output (raw text; parallel/fan-out phases produce a JSON array string) |
| `{outputs.KEY}` | JSON-stringified named output (`""` if missing) |
| `{item.prop}` | fan-out only: `String(item.prop)`; left literal outside fan-out or when the property is missing |
| `{item}` | fan-out only: JSON-stringified current item; left literal elsewhere |

## Agent definitions

`.agents/subagents/<name>.md` (project, discovered by walking up from cwd to the nearest `.agents/` directory) or `~/.agents/subagents/<name>.md` (user). Project wins on name conflicts. Format:

```markdown
---
name: scout
description: Fast read-only recon
model: gpt-5.6-luna
thinking: low
runner: pi
---
You are a fast recon agent. Only read; never modify files. Report compressed findings.
```

All frontmatter keys are optional (name defaults to the filename); the body is the system prompt. `runner` pins this agent to a specific runner.

## Runners

A runner is an argv template. Placeholders: `{prompt}`, `{system}`, `{model}`, `{thinking}`, `{agent}`. Built-ins:

| Name | Command |
|------|---------|
| `pi` | `pi -p --no-session --model {model} --thinking {thinking} --append-system-prompt {system} {prompt}` |
| `codex` | `codex exec -m {model} {prompt}` |
| `cursor` | `cursor-agent -p --model {model} {prompt}` |
| `claude` | `claude -p --model {model} --append-system-prompt {system} {prompt}` |

Only the default runner's CLI (`pi`) is a hard dependency. The other built-in templates are dormant until a step selects them: before any run (fresh or resumed) `run.mjs` preflights every runner the chain actually uses and refuses to start if a CLI is missing from PATH, and `--dry-run` marks missing binaries with `⚠ "cmd" not found on PATH`.

Composition rules: if the template has no `{system}` token, the system prompt is prepended to the prompt (separated by `---`). A token that is exactly one placeholder resolving to empty is dropped together with its preceding flag token — so a step without a `model` simply omits `--model`. Runner selection per step: `--runner` CLI override → agent's `runner` → config `defaultRunner` → `pi`.

Config (`.agents/workflows.json`, walk-up; then `~/.agents/workflows.json`; values starting with `$` interpolate from env):

| Key | Meaning |
|-----|---------|
| `defaultRunner` | runner name used when nothing else selects one (default `pi`) |
| `runners` | map of name → argv template; merges over (and can replace) built-ins |
| `timeoutMinutes` | per-agent-step wall clock limit; kills the child on expiry |
| `stateDir` | override the run-state root (default `<nearest .agents>/workflow-runs`) |

## Run state

`.agents/workflow-runs/<wf_uuid>/`:

- `state.json` — atomic snapshot: workflow, pid, status (`starting|running|completed|failed|stopped`), per-phase status + output file, persisted `outputs` map and `previous` text, timestamps, error.
- `phase-NN.out.txt` — each completed phase's output.
- `runner.log` — stdout/stderr of background runs.

Status transitions: phases go `pending → running → completed|failed`; the run ends `completed`, `failed` (first phase error), or `stopped` (SIGINT/SIGTERM/`status.mjs --stop`). A `running` run whose pid is gone shows as `stale` in status.mjs. `run.mjs --resume <id>` revalidates the stored workflow, keeps `completed` phases and their persisted outputs, resets the rest to `pending`, and continues.

## Exit codes

`run.mjs`: 0 completed, 1 failed/invalid, 130 stopped. `validate.mjs`: 0 valid, 1 invalid. `status.mjs --stop`: 0 signal sent or already gone, 1 no such run / not running.
