---
name: commit
description: Inspect git changes, stage only related files, and create Conventional Commits. Use when the user says commit, commit this, write a commit message, stage and commit, or asks you to commit current work.
---

# commit

Inspect the worktree, decide a coherent commit set, write the Conventional Commits message yourself, and create the commit. Do not push unless the user explicitly asks.

## Setup

Requires `git` on PATH and a git worktree (repo root or subdirectory). No tokens or config files.

## Process

1. Run `git status` and inspect relevant diffs (`git diff` / `git diff --cached`) before staging anything.
2. Decide the commit set from the actual codebase changes — not from the user's casual summary alone.
3. Stage only files that belong in one coherent commit. Never bundle unrelated work.
4. Do not stage secrets, local config, logs, caches, or unrelated files.
5. If changes are unrelated, create separate conventional commits, or commit the main coherent set and report what remains unstaged.
6. Generate the commit message (see format below) and create the commit.
7. After committing, show the commit hash and full message.

## Message format

Subject line (Conventional Commits):

```
type(optional-scope): imperative summary
```

- First line ≤ 72 characters.
- Prefer types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Body explains **why**, not a file laundry list.
- Body hard-wraps at 72 columns. This is the one place hard-wrapping is correct (`git log` does not reflow). Prose everywhere else stays one logical line per paragraph.

Example:

```
fix(auth): reject expired session tokens

Tokens past `exp` were accepted when the clock skew window
was misapplied. Clamp skew before the expiry check so
replayed sessions fail closed.
```

Pass the message via a HEREDOC so formatting stays intact:

```bash
git commit -m "$(cat <<'EOF'
type(scope): subject

Body hard-wrapped at 72 columns explaining why.
EOF
)"
```

## Hard rules

- Never push unless the user explicitly asks.
- Never amend unless the user explicitly asks (and only when amend is safe: your commit, not pushed, hooks did not reject a prior attempt that needs a new commit).
- Never force-push unless the user explicitly asks.
- Never skip hooks (`--no-verify`, etc.) unless the user explicitly asks.
- Never update git config.

## User constraints

If the user passes extra constraints (e.g. "only the lsp changes"), treat them as binding filters on the commit set. If none, use `- None.`
