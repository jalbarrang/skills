# Project Review Context Template

Use this template to create a project-specific
`references/PROJECT-CONTEXT.md` for the `code-reviewer` skill.

Replace every placeholder with concrete, codebase-specific details.
Avoid generic statements.

---

# Project Review Context (<project-name>)

## Architecture Overview

Describe the system shape in dependency order (low-level to high-level).

Example structure:
1. `path/to/foundation-module`
   - Purpose
   - Primary responsibilities
2. `path/to/runtime-module`
   - Purpose
   - Primary responsibilities
3. `path/to/integration-module`
   - Purpose
   - Primary responsibilities

Review implication:
- Explain how bugs propagate across layers.

## Critical Invariants

List must-hold correctness properties reviewers should aggressively protect.

- Invariant 1:
  - Why it matters
  - What breaks if violated
- Invariant 2:
  - Why it matters
  - What breaks if violated
- Invariant 3:
  - Why it matters
  - What breaks if violated

## Known Patterns That Can Look Suspicious (Intentional)

Capture patterns that often look like bugs but are intentional design choices.
This reduces false positives.

- Pattern 1:
  - Why it looks suspicious
  - Why it is intentional
- Pattern 2:
  - Why it looks suspicious
  - Why it is intentional

## State Management Model

Document what is persisted vs reconstructed vs runtime-only.

Persisted state:
- Item A
- Item B

Reconstructed state:
- Item A
- Item B

Runtime-only state:
- Item A
- Item B

Review implication:
- Where boundary bugs usually occur.

## Common Bug Categories in This Codebase

List historical or high-risk failure classes.

- Category 1:
  - Typical trigger
  - Typical impact
- Category 2:
  - Typical trigger
  - Typical impact
- Category 3:
  - Typical trigger
  - Typical impact

## Testing Conventions

Record test stack and common test styles so verifier checks realistic evidence.

- Test framework(s)
- Common mocking patterns
- Where integration tests live
- Where unit tests live
- Accepted testing shortcuts/patterns

Review implication:
- What test evidence is expected for bug confirmation/dismissal.

## Known Limitations / Technical Debt

List known design limitations that should not be re-flagged as novel bugs
unless the current change worsens them.

- Limitation 1
- Limitation 2
- Limitation 3

## Review Priorities

Rank the top four review priorities for this codebase.

1. Priority 1
2. Priority 2
3. Priority 3
4. Priority 4

## Optional: Project-Specific Severity Calibration

Define severity scoring anchors to improve consistency.

- Severity 9-10:
  - What qualifies in this codebase
- Severity 7-8:
  - What qualifies in this codebase
- Severity 5-6:
  - What qualifies in this codebase
- Severity 3-4:
  - What qualifies in this codebase
