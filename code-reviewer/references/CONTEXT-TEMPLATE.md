# Project Review Context — Template

This is the skeleton `init` fills in to produce `.code-reviewer/context.md`.
The file programs every future review of this repo, so it is maintained by the
**anti-rot principle** — the same discipline as an AGENTS.md context file:

1. **Invariants, not incidents.** State the durable rule a reviewer must protect,
   never the war story. "Auth tokens MUST be redacted before logging (owner:
   `logger.ts`)" — not "remember when we leaked a token".
2. **One owner per fact.** Point at the file/module that owns a rule. Don't
   restate drift-prone values (version numbers, file inventories, line counts).
3. **Every line changes a review decision.** If deleting a line would not change
   what the reviewer flags or suppresses, delete it. No narration, no praise.
4. **Update on every miss.** A false positive (intentional pattern flagged) or a
   miss (real bug not caught) is folded back here via `/code-reviewer learn`, as a
   durable invariant.
5. **Dead-fact test.** Each concrete value must survive a refactor — or be
   replaced by its owner.

Keep it dense and scannable. Delete any section the project hasn't earned. Replace
every placeholder with concrete, codebase-specific detail; a generic line is worse
than no line.

---

# Review Context — <project-name>

## Mode signals
<!-- One line: default review target (e.g. `git diff main...HEAD`) and the base
branch reviewers should diff against. -->

## Architecture (dependency order)
<!-- Low-level → high-level, one line each: `path/ → responsibility`. State how a
bug in a lower layer propagates up, because that drives reachability judgement. -->

## Critical invariants
<!-- The must-hold correctness properties. Each: the rule (bold lead), the file
that owns/enforces it, and what breaks if violated. These get aggressive
protection and high severity when threatened. -->
- **<invariant>:** owner `path`. Breaks → <impact>.

## Intentional patterns (false-positive suppressors)
<!-- Patterns that look like bugs but are deliberate. This is the section that
stops the reviewer from crying wolf. Each: what it looks like + why it's fine. -->
- **<pattern>:** looks like <suspicion>; intentional because <reason>.

## State model
<!-- Persisted vs reconstructed vs runtime-only state, and where the boundary
bugs live. Name the owner of each store. -->
- Persisted: <what> (owner `path`)
- Reconstructed: <what>
- Runtime-only: <what>

## Historical bug classes
<!-- Failure classes this codebase actually ships. Each: typical trigger + impact.
Reviewers weight these higher. Do NOT re-flag known limitations as novel bugs
unless the change worsens them. -->
- **<class>:** trigger <...>, impact <...>.

## Testing conventions
<!-- Framework(s), where unit vs integration tests live, common mocking patterns,
accepted shortcuts. Tells the verifier what test evidence counts as coverage when
confirming or dismissing a finding. -->

## Severity calibration
<!-- Project-specific anchors so scores are consistent across reviews. -->
- 9-10: <what qualifies here>
- 7-8: <...>
- 5-6: <...>
- 3-4: <...>

## Review priorities
<!-- Ranked: the few things a reviewer of THIS codebase should look at first. -->
1.
2.
3.
