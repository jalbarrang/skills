---
name: code-reviewer
description: Bug-focused code review driven by a per-project review context and optional multi-lens criteria. Resolves a git diff target, loads lenses, runs a context-aware discovery pass and a skeptical verifier, then reports findings in severity tiers. Use when reviewing pull requests, branch diffs, uncommitted changes, or when the user asks for a bug-focused code review. Sub-commands - init, review, learn, status.
argument-hint: "[init|review|learn|status] [target]"
user-invocable: true
disable-model-invocation: true
---

# Code Reviewer

A bug-focused review workflow whose signal comes from a **per-project review context** (`.code-reviewer/context.md`) plus optional **lenses** (`.code-review/lenses/*.md`). The context carries invariants, intentional patterns, and failure classes; lenses add criteria-specific evaluation. Without context, review is generic; with it, review is sharp.

The context file is maintained by the **anti-rot principle**: durable invariants, one owner per fact, every line changes a review decision, and a `learn` loop that folds each miss back in. See `references/CONTEXT-TEMPLATE.md` for the shape.

## Setup (run before any command)

1. Read `.code-reviewer/context.md` in the project root.
   - **Present** → review runs in `project-specific` mode. Treat its invariants, intentional patterns, and severity calibration as authoritative.
   - **Missing or unreadable** → review runs in `generalized` mode. Do NOT auto-generate context. For any command except `init`, tell the user once: "No project review context found — run `/code-reviewer init` to make reviews project-aware." Then continue the requested command in generalized mode and say so in the final output.
2. Parse the first argument word to pick a command (routing below). Everything after the command name is the target/argument.

## Commands

| Command | Description | Reference |
|---|---|---|
| `init` | Interview + codebase scan → write `.code-reviewer/context.md` | [references/init.md](references/init.md) |
| `review [target]` | Resolve diff → load lenses → review → tiered findings | [references/review.md](references/review.md) |
| `learn [note]` | Fold a false positive or a missed bug into the context (anti-rot) | [references/learn.md](references/learn.md) |
| `status` | Report what review context exists and whether it is stale | [references/status.md](references/status.md) |

### Routing rules

1. **First word is `init` / `review` / `learn` / `status`** → read that command's reference file and follow it. This is non-optional; the reference owns the flow.
2. **First word doesn't match a command** → treat the entire argument as a `review` target (e.g. `/code-reviewer src/auth` → review scoped to `src/auth`). Load `references/review.md`.
3. **No argument** → if context is missing, recommend `init`. Otherwise run `review` against the default target (uncommitted changes via `scripts/target.mjs`).

## Review mechanics (scripts)

Scripts are Node ≥ 20 ESM, invoked as `node <skill-dir>/scripts/<name>.mjs` from the project under review.

| Script | Role |
|---|---|
| `scripts/target.mjs` | Resolve git diff (`--uncommitted` default, `--branch <base>`, `--commit <sha>`), write full diff + file list to a temp file, print path + stat digest |
| `scripts/lenses.mjs` | Discover `.code-review.json` + `.code-review/lenses/*.md`, print applicable lens instructions (or a no-lenses example) |

Severity / finding format conventions: [references/severity.md](references/severity.md).

## Operating rules

- Prioritize correctness and reliability bugs. Exclude style, naming, formatting, comments, docs, and optional refactors that are not bugs.
- Be explicit and evidence-driven. Every finding cites file, line range, and a traceable reason.
- When `context.md` says a pattern is intentional, the verifier must honor it — do not re-flag suppressed patterns.
- After a review, if the user says a finding was wrong (false positive) or names a bug you missed, offer `/code-reviewer learn` so the lesson sticks.
