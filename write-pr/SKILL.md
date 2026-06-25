---
name: write-pr
description: Write concise, high-signal pull request descriptions with mermaid diagrams. Use when opening a PR, writing or improving a PR body, or running `gh pr create` — especially for architectural, contract, data-flow, pipeline, or state-machine changes where a diagram beats prose.
---

# Write PR

Produce a short, scannable PR description that a reviewer with zero context can
grok in under a minute. Diagrams carry the structure; prose fills the gaps.

## Structure (in this order)

1. **Lede** — one or two sentences: what this PR does *and why it exists* (the
   change in context). No "This PR…", no restating the title.
2. **Mermaid diagram(s)** — when the change has shape worth seeing: data flow,
   decision/branch logic, state machine, architecture, or before/after. Prefer
   **1–2 focused diagrams** over paragraphs. Show, don't narrate.
3. **What's here** — bullets mapping each load-bearing file/module → its role.
   Not a file dump; the pieces a reviewer must understand.
4. **Gates / verification** — concrete proof: typecheck status, test counts
   (`+N`), lint result. Numbers, not adjectives.
5. **Caveats** — honest trade-offs, follow-ups, and *expected-but-surprising*
   signals (e.g. a linter/dead-code flag that's intentional). Quote them so a
   reviewer doesn't re-discover them as "problems."
6. **Links** — spec/companion docs, related PRs/issues, the plan.

## Rules

- **Concise.** Every line earns its place. Cut greetings, "in this PR we…",
  and anything restating the title.
- **Ground every claim in the diff.** Run `git log --oneline <base>..HEAD` and
  `git diff <base> --stat` first; describe what changed, not aspirations.
- **Diagrams are the centerpiece** for structural change. If you're tempted to
  write three paragraphs explaining flow, draw it instead.
- **Be honest about rough edges.** A PR that flags its own caveats earns trust;
  hidden ones erode it.
- **Match repo conventions** — title prefix (`feat:`/`fix:`/`docs:`…), and any
  required body sections.

## Mermaid cheatsheet

- Pipeline / data flow → `flowchart LR`
- Decision / negotiation / branching → `flowchart TD` with `{...}` nodes
- Before/after → two `subgraph`s joined by an arrow
- Lifecycle / status → `stateDiagram-v2`
- **Quote labels** containing `()`, `:`, `≠`, `&`, `<`, `>` etc. — use
  `["..."]` / `{{"..."}}`, and HTML entities (`&lt;`, `&amp;`, `<br/>`) inside
  labels. Keep node text short; push detail to the body.

## Process

1. `git log --oneline <base>..HEAD` + `git diff <base> --stat` to see the real change.
2. Identify the **shape**: is there a pipeline, a decision, a before/after, or a
   state machine worth one diagram? If purely additive/trivial, skip the diagram.
3. Draft: lede → diagram(s) → what's here → gates → caveats → links.
4. Trim. Then create: `gh pr create --title "<prefixed>" --body-file <file> --base <base>`.

## Example skeleton

```markdown
<one-line what + why>

## <Flow name>
\`\`\`mermaid
flowchart LR
  A["input"] --> D{{"decode (boundary)"}}
  D -->|invalid| E["TypedError"]
  D -->|ok| M["Model"] --> N["next stage"]
\`\`\`

## What's here
- **path/to/module.ts** — its role in one line.

## Gates
typecheck ✅ · 1624 tests ✅ (+11) · lint 0 errors.

> Expected-noise: <the intentional flag / follow-up>.

Spec: docs/<companion>.md.
```
