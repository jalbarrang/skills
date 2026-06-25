---
name: write-an-adr
description: Create Architecture Decision Records. Default format is compact (title + summary paragraph). Extended format uses Nygard convention (Context, Decision, Status, Consequences) when the decision involves integration, multiple options, or diagrams. Use when the user wants to document an architecture decision, record a technical trade-off, write an ADR, or mentions "architecture decision record".
---

# Architecture Decision Records

## When to write an ADR

All three must be true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives you picked between

If any is missing, skip the ADR.

## Formatting

Write **one paragraph per line** (soft-wrap). Never hard-break paragraphs at a fixed column width — it hurts scannability, diffs, and agent reading. Lists, tables, and code/Mermaid blocks keep their natural line structure.

## Location and numbering

ADRs live in `docs/adr/`. Scan for the highest existing number and increment by one.

Naming: `NNNN-slug.md` (e.g. `0001-use-postgres-for-write-model.md`).

Create `docs/adr/` lazily — only when the first ADR is needed.

## Two formats

### Compact (default)

Use for most decisions. See [FORMAT.md](FORMAT.md) for the template.

```md
# Short title of the decision

1-3 sentences: what's the context, what did we decide, and why.
```

That's it. A single paragraph. The value is in recording *that* a decision was made and *why*. Add optional sections (Status, Considered Options, Consequences) only when they add genuine value.

### Extended (Nygard convention)

Upgrade to extended when the decision involves **any** of:
- System integration or deployment topology (needs diagrams)
- Multiple concrete options being evaluated (needs Considered Options)
- Cross-team or cross-repo impact (needs explicit Consequences)
- Prerequisites or phased rollout (needs structure)

See [NYGARD-FORMAT.md](NYGARD-FORMAT.md) for the full template.

```md
# N. Title as short noun phrase

Date: YYYY-MM-DD

## Status
## Context
## Decision
## Consequences
```

Plus optional: Considered Options, Diagrams (Mermaid), Prerequisites, Recommendation.

## Choosing the format

Ask yourself: "Can a future developer understand this decision from one paragraph?" If yes → compact. If no → extended.

Most ADRs should be compact. Reach for extended only when the paragraph would turn into an essay.
