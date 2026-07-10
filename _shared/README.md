# `_shared/`

Templates copied into each skill (e.g. `scripts/lib/config.mjs`). Never import these files across skills — the skills CLI copies one skill directory at a time into each harness, so shared helpers must be duplicated per skill from this canonical source.
