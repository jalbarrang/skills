---
name: pr-babysitter
description: Watch a pull request's CI checks until they settle, and surface new review/bot comments — using the gh CLI in the terminal. Use after opening or pushing to a PR when the user says "babysit the PR", "watch CI", "wait for checks", "did CI pass", or wants to be told when a PR merges or fails.
---

# PR Babysitter

Poll a PR's checks and comments with `gh` until they reach a terminal state, then
report. This watches one PR at a time — the one on the current branch unless the
user names another.

> Note: this is a terminal-driven poll loop. It blocks while polling. Set a
> sensible interval and timeout so it doesn't run forever.

## Setup

Requires the GitHub CLI authenticated: `gh auth status`. All commands below run
from inside the repo's working tree.

## 1. Resolve the PR

```
gh pr view --json number,headRefName,state,url
```

- No PR on the branch → tell the user to open one first, stop.
- `state` is `MERGED` or `CLOSED` → nothing to babysit, report and stop.
- `state` is `OPEN` → capture the `number` and continue.

## 2. Poll the checks

`gh pr checks` exits non-zero while checks are pending/failing but still emits
JSON — that's expected, don't treat the exit code as a hard error.

```
gh pr checks <number> --json name,state,bucket,link
```

Each check's `bucket` is one of `pass`, `fail`, `pending`, `skipping`, `cancel`.
Checks have **settled** when no bucket is `pending`.

Poll loop (≈60s interval, 20-min cap):

```bash
PR=<number>
for i in $(seq 1 20); do
  out=$(gh pr checks "$PR" --json name,state,bucket,link 2>/dev/null)
  pending=$(echo "$out" | jq '[.[] | select(.bucket=="pending")] | length')
  state=$(gh pr view "$PR" --json state -q .state)
  if [ "$state" != "OPEN" ]; then echo "PR is now $state"; break; fi
  if [ "$pending" -eq 0 ]; then echo "Checks settled."; break; fi
  echo "[$i] $pending check(s) still pending..."; sleep 60
done
gh pr checks "$PR" --json name,bucket | jq -r '.[] | "\(.bucket)\t\(.name)"'
```

## 3. Check for new comments (optional)

Surface review activity the user may need to act on:

```
gh pr view <number> --json comments,reviews
gh api repos/{owner}/{repo}/pulls/<number>/comments   # inline review threads
```

Diff against what you've already reported so you only flag *new* comments. Skip
the PR author's own comments (`gh api user -q .login` gives your login).

## 4. Report

When the loop ends, summarize:
- Final check verdict: how many passed / failed / skipped, with the failing
  check names and their `link` for logs.
- Whether the PR merged or closed during the watch.
- Any new review or bot comments since you started.

## Rules

- **Don't busy-poll.** 30–60s intervals; cap total wait (e.g. 20 min) so the
  loop is bounded.
- **Terminal states end the watch:** all checks settled, or PR merged/closed.
- **Failing ≠ pending.** Report a failed check immediately rather than waiting
  out the full timeout.
- **One PR at a time.** Resolve a specific `number` and stick to it.
