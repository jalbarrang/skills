# Clean Code

Flag maintainability hazards in the diff that make bugs likely or hide them: functions doing too much, misleading names, duplicated logic that can drift, and control flow too dense to verify by reading.

## Criteria

- **Function does more than one thing** — a changed/added function mixes distinct responsibilities (I/O + business rule + formatting). Flag when the mix makes the behavior hard to verify or test, not merely long.
- **Misleading names** — a name that promises one behavior while the body does another (`getUser` that creates one, `isValid` with side effects). These cause bugs at call sites.
- **Duplicated logic, single source of truth violated** — the diff copies a rule that already exists elsewhere instead of reusing its owner. Flag the copy and name the owner; divergence is a future bug.
- **Deep nesting / dense conditionals** — new code beyond ~3 levels of nesting or compound boolean logic without early returns or extraction. Flag only when correctness is hard to confirm by reading.
- **Magic values** — new unexplained literals that encode a business rule (thresholds, retry counts, status codes) with no named constant or owner.
- **Dead or unreachable code introduced** — new code paths that cannot execute, or leftover debug scaffolding.
- **Comment/code disagreement** — a changed body whose adjacent comment or docstring now lies. Flag the disagreement, not comment style.

Do NOT flag: formatting, import order, naming preferences that don't mislead, or refactors the diff didn't touch.

## Severity

- blocker: duplicated business rule that has already diverged from its owner within this diff
- warning: misleading name, mixed-responsibility function, or magic value on a code path other modules call
- note: nesting depth, dead code, stale comment, or extraction opportunity confined to the changed file
