---
name: code-reviewer
description: Runs a structured multi-pass code review using parallel discovery passes, majority voting, and skeptical verification. Use when reviewing pull requests, branch diffs, or when the user asks for a bug-focused code review.
disable-model-invocation: true
---

# Code Reviewer

This skill runs a local multi-pass code review workflow inspired by Bugbot:
parallel discovery, majority voting, and conservative verification.

## Setup

1. Attempt to read project context:
   - `references/PROJECT-CONTEXT.md`
2. If `PROJECT-CONTEXT.md` is missing or unreadable:
   - Continue with a generalized review flow.
   - Do not auto-generate project context.
   - Mention in final output that project-specific context was unavailable.
   - Suggest `/setup-code-review` only as an optional next step.
3. Collect the review target:
   - Use `git diff main...HEAD` unless the user provides a different base.
4. Enumerate changed files and read full file context for each changed file.

If there is no diff, report that there are no changes to review and stop.

## Phase 1: Discovery (Parallel)

Run three independent discovery passes with the `bug-finder` subagent in
parallel. Give each pass the same diff and project context, but different file
ordering instructions:

- Pass A: alphabetical path order
- Pass B: reverse alphabetical order
- Pass C: dependency-aware order (lower-level packages first)

Each pass must output structured findings with:

- `file`
- `lineRange`
- `category`
- `severity` (1-10)
- `confidence` (0-100)
- `summary`
- `reasoning`

Allowed categories:

- logic
- state-management
- null-safety
- control-flow
- security
- concurrency
- type-safety
- error-handling

Explicitly exclude:

- style, formatting, naming, comments, docs
- import sorting
- backwards-compatibility warnings unless explicitly requested
- optional refactor suggestions that are not bugs

## Phase 2: Majority Voting

Merge findings from all discovery passes:

1. Group by `file + lineRange + category`.
2. Keep only findings reported by at least two independent passes.
3. For merged findings, preserve the strongest concise rationale and keep the
   highest confidence score as the starting confidence for verification.

## Phase 3: Verification

Send merged findings to the `bug-verifier` subagent.

Verifier requirements:

- Re-read broad context (100+ lines around each finding)
- Trace reachability
- Check for existing guards and related tests
- Cross-check project-specific known intentional patterns when context exists
- Re-score severity and confidence
- Drop findings below `confidence < 50`

## Phase 4: Final Report

Return findings in three tiers:

- **Critical**: `severity >= 8` and `confidence >= 70`
- **Important**: `severity >= 5` and `confidence >= 60`
- **Minor**: `severity >= 3` and `confidence >= 50`

Also include:

- Dismissed findings (concise reason for dismissal)
- Context mode:
  - `project-specific` when `PROJECT-CONTEXT.md` was used
  - `generalized` when project context was unavailable
- Review metadata:
  - files reviewed
  - findings from discovery
  - findings after majority voting
  - findings after verification
  - final findings count

## Operating Rules

- Prioritize correctness and reliability bugs.
- Be explicit and evidence-driven.
- If there are no findings, clearly state that no actionable bugs were found.
