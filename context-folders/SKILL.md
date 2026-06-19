---
name: context-folders
description: Search and reference code in additional project folders outside the current workspace. Use when work spans multiple repos/checkouts and the user asks you to look at, search, or reference code in a sibling project, monorepo package, or external checkout.
---

# Context Folders

Make code in folders *outside* the current workspace searchable by full path, so
cross-repo work (a shared library, a sibling service, an external checkout)
doesn't require leaving the chat.

## In Cursor, prefer the natives first

Before using this skill, reach for what Cursor already does well:
- **`@folder` / `@file`** — pull a specific folder or file into context directly.
- **`.cursor/rules`** with glob scopes — attach standing context for paths that
  match a pattern.

Use this skill for the case those don't cover: **ad-hoc search across one or more
external folders by absolute path** during a task.

## Declare the folders

Keep a short list of the extra folders this project cares about. Either inline in
your request ("also search `/Users/me/work/shared-lib`") or in a small config the
agent reads, e.g. `.cursor/context-folders.json`:

```json
{
  "folders": [
    { "label": "shared-lib", "path": "../shared-lib" },
    { "label": "api", "path": "/Users/me/work/api" }
  ]
}
```

Resolve each `path` to an absolute path and confirm it exists before searching.

## Search with the tools you already have

There is no special tool — point your normal commands at the full paths:

```
rg "createSession" /Users/me/work/shared-lib
find /Users/me/work/api -name "*.proto"
ls /Users/me/work/shared-lib/src
```

And `read` files by absolute path once you've located them.

## Rules

- **Absolute paths.** Resolve relative entries against the workspace root, then
  use the absolute path so commands work regardless of cwd.
- **Confirm existence.** If a configured folder is missing, say so and skip it
  rather than guessing.
- **Scope deliberately.** Only search external folders when the task references
  them — don't widen every search to all repos.
- **Read, don't assume.** Once you find a relevant file in an external folder,
  read it; don't infer its contents from the path.
