# Execution discipline

Load this when executing tasks, delegating them to subagents, or closing out a plan. These rules exist because agents drift in predictable ways: they mark tasks done without proof, implement discovered tangents mid-plan, write to the wrong plan, and force statuses instead of resolving tasks.

## Delegation gates

When a task will be executed by a *different* agent (subagent, future session, another harness), its `details` must end with a **verification gate** a zero-context executor can run without judgement:

- A concrete command and its expected output (`bun test` green, `node cli.mjs --help` exits 0, a grep that must match).
- Any **STOP conditions** — situations where the executor must halt and report instead of improvising ("STOP if the API shape differs from what the source encodes").

When you are planning and executing yourself in the same session, skip the ceremony: lightweight `description`-only tasks, with the real context in HANDOFF.md.

The orchestrator re-verifies gates from the repo after a subagent reports — never trust a subagent's self-report of success.

## Scoping writes

Every ledger write names its target explicitly: `--plan <name>` on `update-task`, `add-task`, `create-handoff`, `revise-plan`. Implicit resolution (the sole in-progress plan) is fine for *reads* like `status`; on writes it eventually lands an update in the wrong plan after a context switch. When multiple plans are in progress, `--plan` is mandatory everywhere.

## Discovered work

Anything worth doing that is *not* in the current plan gets captured, not implemented:

```bash
taskman add-task --plan <plan> "short label" --reason "what you noticed and why it matters"
```

Then continue with the planned tasks. Discovered tasks are deferred for the user to triage — acting on them mid-plan is scope drift, even when they're good ideas.

## Reconcile etiquette

`taskman reconcile` compares registry status against task state across every plan:

1. Run it **read-only first** and review the reported drift.
2. `reconcile --apply` only after review. It performs the safe projection (`in-progress → done`) and nothing else.
3. **Never regress a done plan.** A `done` plan showing unfinished tasks means work merged without marking tasks — mark those tasks done with notes; do not reopen the plan or force statuses.

## Closing out

- A plan finishes by **resolving its tasks** — `done` is a projection, `close` is only for `superseded`/`abandoned` (always with a reason recorded).
- Resolve several finished tasks in one pass rather than leaving them stale, each with notes that say what was done or why skipped — notes are the audit trail the next session reads.
- Blocked tasks carry the *decision needed*, not just "blocked": the note should let the user unblock it without re-deriving context.
- An initiative normally reaches `done` by projection when its last member plan closes; check `taskman initiative-status <name>` rather than forcing it.
