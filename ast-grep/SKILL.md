---
name: ast-grep
description: Structural (AST-based) code search and rewrite using the ast-grep CLI. Use when matching code by shape rather than text — call shapes like `console.log($A)`, function/class structure, imports, or any mechanical refactor across a codebase. Prefer over text grep for code-shape matches and rewrites.
---

# ast-grep

Search and rewrite code by its **syntax tree**, not as text. Where `grep` matches
characters, `ast-grep` matches structure — so `foo($A)` matches `foo(1)`,
`foo(x + y)`, and `foo(  bar()  )` regardless of whitespace or argument content.

Use this for code-shape searches and mechanical refactors. Use plain `grep`/`rg`
only for comments, strings, or non-code text.

## Setup

Requires the `ast-grep` CLI on PATH (binary is `ast-grep`, alias `sg`):

```
brew install ast-grep
# or
npm i -g @ast-grep/cli
```

Verify: `ast-grep --version`.

## Core command

```
ast-grep run --pattern '<pattern>' --lang <lang> [path]
```

- `--pattern` / `-p` — the code shape to match (see metavariables below).
- `--lang` / `-l` — `ts`, `tsx`, `js`, `jsx`, `py`, `go`, `rust`, `java`, `c`, `cpp`, `html`, `css`, etc.
- `path` — file or directory. Defaults to the current directory.

## Metavariables

| Token | Matches |
|-------|---------|
| `$A`, `$NAME` | exactly one node (an expression, identifier, etc.) |
| `$$$ARGS` | zero or more nodes (e.g. all arguments in a call) |
| `$_` | one node, unnamed (when you don't need to reuse it) |

Names are UPPERCASE by convention. Reuse the same name to require the same
node (`$A === $A` matches only when both sides are identical).

## Search examples

```
# every console.log call in TS/TSX
ast-grep run -p 'console.log($$$ARGS)' -l ts src

# all calls to a function regardless of args
ast-grep run -p 'fetchData($$$)' -l ts

# any function declaration
ast-grep run -p 'function $NAME($$$) { $$$ }' -l js

# imports from a specific module
ast-grep run -p "import { $$$ } from 'lodash'" -l ts
```

## Rewrite

`--rewrite` defines the replacement. **By default this is a dry run** — it prints
a diff and changes nothing. Add `--update-all` to write to disk.

```
# preview: console.log -> logger.debug
ast-grep run -p 'console.log($A)' --rewrite 'logger.debug($A)' -l ts src

# apply it
ast-grep run -p 'console.log($A)' --rewrite 'logger.debug($A)' -l ts src --update-all
```

Metavariables captured in the pattern are reused in the rewrite (`$A` above
carries the original argument through).

## Workflow rules

1. **Always dry-run first.** Run without `--update-all`, read the diff, then
   re-run with `--update-all` once the matches look right.
2. **Scope the path.** Pass a directory to avoid matching `node_modules`,
   `dist`, or build output.
3. **Pick the right `--lang`.** `tsx`/`jsx` for files with JSX; `ts`/`js`
   otherwise. A wrong lang silently matches nothing.
4. **Tighten over-broad patterns.** If a pattern matches too much, add structure
   (surrounding call, type annotation) instead of falling back to text grep.

## When NOT to use

- Matching comments, log message strings, or config text → use `rg`.
- One-off single-file edits where you already know the exact text → use a normal
  find-and-replace edit.
