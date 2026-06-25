---
name: write-context-file
description: Create or maintain project context files (AGENTS.md, CLAUDE.md) using the anti-rot principle — durable invariants with single owners, no drift-prone inventories. Use when writing, updating, or auditing an AGENTS.md/CLAUDE.md, or when a user says "update the agents file", "absorb this into the context file", or "anti-rot pass".
---

# Write Context File

A context file is **code that programs every future agent session**. Unmaintained
instructions are technical debt: stale facts actively mislead, and bloat buries
the rules that matter. Optimize for a cold agent scanning fast.

## The anti-rot principle

1. **Invariants, not incidents.** A rule earned from a field bug states the
   durable rule, never the story. Write "tools spawning subprocesses MUST forward
   the AbortSignal", not "remember when the gen tool orphaned a process".
2. **One owner per fact.** Anything that drifts — tool lists, env-var lists,
   versions, instance ids, port numbers — lives in exactly one place (code,
   terraform output, a script). The context file **names the owner** instead of
   restating the value: "the sync list lives in deploy.sh, not here".
3. **Every line changes behavior.** If deleting a line wouldn't change what an
   agent does, delete it. No history, no praise, no narration.
4. **Update on every miss.** When an agent fails because the file didn't warn it,
   amend the file **in the same change as the fix** — as an invariant. A context
   file that never absorbs its misses is rotting silently.
5. **The dead-fact test.** For each concrete value ask: does this survive a
   refactor / redeploy / instance replacement? If not, replace it with its owner
   ("instance id comes from `terraform output` — never hardcode it").

## Structure

Core sections (always, in this order), then optional ones as the project earns them:

```md
# AGENTS.md
## What this is      → 2-4 sentences: what the system is, how it's triggered/
                       deployed, where the authoritative tool/feature list lives
                       (the code). For multi-package repos: the dependency
                       direction as ONE line ("apps/* → packages/* only").
## Stack             → table (Area | Tech) — tables beat bullets for enumerable
                       facts an agent scans for one row.
## Commands          → table (Task | Command): the EXACT invocations agents run
                       — dev, test, lint, deploy, and mock/dry-run variants.
## Rules             → the meat. One bullet per invariant, **bold lead** naming
                       the rule, then the mechanism + the file that owns it.
                       Group by domain (Git / style / subsystem) when >10 rules.
## Key paths         → annotated tree, one line per dir: path → what lives there
## Gotchas           → the update-on-every-miss landing zone: each entry is an
                       invariant earned from a real failure, phrased so the next
                       agent recognizes the symptom ("ERR_MODULE_NOT_FOUND
                       pointing at a directory means a missing exports entry").
```

Optional, when earned:
- **Runtime constraints** — environment quirks stated as constraint + escape
  hatch ("window.confirm is silently blocked → use the useConfirm hook").
- **Subsystem section** — when a subsystem has an external consumer, give it its
  own section: the contract (versioned shapes, stdout/exit semantics), explicit
  `Decision:` lines for deliberate choices, a canonical test fixture by name,
  and a "known divergences (resolved)" register.
- **Tool-injected blocks** (e.g. an SDK's `<agents-index>`) — preserve them
  untouched at the top; never imitate or hand-edit them.

## Writing the Rules section

- **Bold lead, then mechanism**: `- **Write posture:** gated in pi/runner.ts.
  Off (default): ... On: ...` — scannable headline, detail after.
- State **why** only when the why prevents a wrong "fix" (e.g. "don't switch to
  noTools — the Datadog extension needs `read`"). Otherwise the rule suffices.
- Name files/identifiers in backticks so agents can grep them.
- Cross-repo or duplicated invariants (e.g. a policy living in both a persona
  and the doc): say so explicitly — "X owns the wording; keep in sync".
- Rationale has its own owner too: deep "why" lives in ADRs / `docs/patterns/`;
  the context file points ("read the relevant ADR before reshaping an area it
  covers") instead of restating.
- Dense beats pretty: a 6-line bullet that fully specifies a subsystem beats a
  section with headings.

## Audit workflow (existing file)

1. Grep every concrete value (ids, hostnames, tags, lists) — apply the
   dead-fact test; replace dead ones with their owner.
2. Diff the file against reality: tool lists vs the registry, env vars vs
   config parsing, paths vs the tree. Fix or de-inventory.
3. For each recent field bug ask: which line should have prevented it? Missing
   → add the invariant. Present-but-ignored → sharpen the bold lead.
4. Delete anything failing rule 3. Target: every section survives a cold read
   in under a minute.

## Review checklist

- [ ] No fact stated here is owned somewhere else (or the owner is named)
- [ ] No inventories that grow with the codebase (tools, env vars, endpoints)
- [ ] Every bullet has a bold lead an agent can scan
- [ ] No incident narration — each lesson is a standalone invariant
- [ ] Concrete values pass the dead-fact test
- [ ] Commands shown are the ones agents actually run (test/lint/deploy)
