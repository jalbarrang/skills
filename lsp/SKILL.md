---
name: lsp
description: One-shot Language Server Protocol queries for diagnostics, hover type info, go to definition, find references, and file symbols. Use when you need type errors, hover types, definitions, references, or document symbols outside the harness-native LSP, or when Cursor/IDE LSP is unavailable. Prefer harness-native LSP when available. Scope is exactly these five ops.
---

# LSP

Run a single LSP operation against a file by spawning a language server, doing the initialize handshake, opening the document, issuing one request, printing a readable result, then shutting down.

Cold-start latency is accepted (npx may fetch the server on first use). Prefer harness-native LSP (Cursor) when it already covers the query.

## Setup

- Node ≥ 20.
- Optional config via `loadConfig('lsp')` (`.agents/lsp.json` → `~/.agents/lsp.json` → `.pi/lsp.json`):

```json
{ "command": "npx", "args": ["-y", "typescript-language-server", "--stdio"] }
```

- Default when no config and a `tsconfig.json` is found walking up from `--file`: `npx -y typescript-language-server --stdio` (the project must also have a local `typescript` install the server can resolve — TypeScript 5.x; the native TypeScript 7 preview has no `lib/tsserver.js` and is not compatible with typescript-language-server).

## Command

```
node <skill-dir>/scripts/query.mjs --op <op> --file <path> [--line N --col N]
```

| `--op` | Requires position | LSP method |
|---|---|---|
| `diagnostics` | no | collect `textDocument/publishDiagnostics` |
| `hover` | yes (`--line` `--col`, 1-based) | `textDocument/hover` |
| `definitions` | yes | `textDocument/definition` |
| `references` | yes | `textDocument/references` |
| `symbols` | no | `textDocument/documentSymbol` |

Missing `--line` for hover/definitions/references exits 1 with a usage error.

## Scope

Exactly these five ops. No workspace symbols, rename, code actions, or call hierarchy.
