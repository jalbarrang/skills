# Orchestration

Ported from `@dreki-gg/pi-subagent` spawn-subagents skill and orchestration principles. Default operating model: use extra agents to improve reconnaissance, planning, and review, while keeping implementation coherent under one writer unless ownership is clearly partitioned.

## Philosophy

- Prefer **one writer, many thinkers**.
- Use **parallel mode for discovery**, not for competing edits.
- Use **sequential handoffs** (scout → planner → worker → reviewer) for safe sequencing.
- Treat `reviewer` as a **fresh-context verifier**, not as a second implementation agent.
- Reach for subagents to reduce context rot and sharpen conclusions, not to create an arbitrary swarm.

## When to use each agent

| Agent | Use when |
|-------|----------|
| `scout` | Repo reconnaissance; trace a code path; compress context for handoff |
| `docs-scout` | External library/framework/API docs matter |
| `planner` | Need a concrete implementation plan before edits |
| `worker` | Bounded implementation with full tools |
| `reviewer` | Quality/security review of a diff with a fresh lens |
| `validator` | Confirm or falsify one specific bug/behavior claim before it becomes a fix |
| `bug-prover` | Proof needs a minimal failing test or isolated repro artifact |
| `advisor` | Focused second opinion on a tricky or high-risk decision; primary owner stays in charge |
| `ux-designer` | Frontend UI that must avoid default AI aesthetic |

## Patterns

### 1. Single specialist

Use one agent when the task is narrow (`scout`, `docs-scout`, `planner`, `worker`, `reviewer`, `validator`, `bug-prover`, `advisor`).

### 2. Parallel recon

Fan out with `parallel.mjs` for noisy discovery, not implementation races.

- Run `scout` + `docs-scout` when both code and docs matter.
- Keep parallel tasks non-overlapping.
- Return a compact synthesis to the main thread.

### 3. Plan then implement

1. `scout` (and optionally `docs-scout`)
2. `planner`
3. `worker`
4. optional `reviewer`

### 4. Review loop

1. `reviewer` inspects the diff and code
2. if a suspected issue needs evidence, run `validator`
3. if proof still needs a minimal failing test, run `bug-prover`
4. only send confirmed, evidenced findings back to `worker`

### 5. Claim validation and proof

- `validator` first for read-only verification with code, tests, and focused commands
- `bug-prover` only when proof needs a new failing test or isolated repro
- keep repro scope narrow; proving is not fixing

### 6. Targeted advisor consult

Good fits: ambiguous designs, stuck failing-test loops, unclear severity, security-sensitive or migration-heavy changes.

Consult packet: current role, exact question, smallest relevant task summary, touched files/symbols, what was already tried.

Rules: optional not default; primary role owns the final judgment; prefer one clear recommendation over a brainstorm.

## Model routing

Route each subagent task to the model whose strengths match the work. If `~/.agents/AGENTS.md` (or project AGENTS.md) defines a model routing policy scoring intelligence / taste / cost, that policy is authoritative.

Structural rules (harness-independent):

- **Bulk token burn goes cheap.** Log digging, large files/specs, mechanical migrations, clear-spec implementation → cheapest capable model.
- **User-facing output goes tasteful.** Public APIs, SDKs, UI copy, design → highest-taste model, or review by it before shipping.
- **Reviews get the strong model.** Plan and implementation reviews on the strongest model; a cheap model may be an extra perspective, never the only reviewer.
- **Defaults, not limits.** If a cheaper model's output misses the bar, rerun on a stronger model without asking.
- **Cost is a tiebreaker only.** Use cheap models to gather information before engaging an expensive one, never to avoid it.
- **Name the model.** When reporting delegated work, say which model ran each task.

Mechanics:

- Pass `--model` / `--thinking` on `spawn.mjs`, or per-object fields in `parallel.mjs` tasks.
- `cursor:<model>` routes through `cursor-agent` (strip the prefix for the CLI `--model` flag).
- Any other model string routes through `pi`.

## Avoid

- Arbitrary peer-to-peer negotiation loops or unbounded swarms
- Multiple workers editing overlapping files
- Calling `advisor` when `planner` or `reviewer` already has enough signal
- Sending speculative review findings for fixes before they are validated
- Pushing raw agent logs back into the main thread as the primary artifact

## When reporting back

- Say which subagents ran and which model each used
- Summarize what each contributed
- Keep the main thread focused on conclusions, not raw logs
