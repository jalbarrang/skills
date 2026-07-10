---
name: context7
description: Fetch current, version-accurate third-party library docs from Context7 before coding against any library API — treat trained-in API knowledge as stale. Prefer docs.mjs with --name (auto-resolves to an exact Context7 ID); use resolve.mjs only when the match is ambiguous. Also retrieves raw cached documents via docRef. Use when importing, configuring, or calling a third-party library, or when the user mentions Context7, library docs, or API lookup.
---

# context7

Pull live library documentation from Context7 instead of relying on model memory. Scripts are Node ≥20 ESM, dependency-free.

## Setup

1. Get an API key from [context7.com](https://context7.com).
2. Export it (preferred):

```bash
export CONTEXT7_API_KEY=ctx7sk-...
```

3. Or set `apiKey` in `~/.agents/context7.json`. Optional TTL overrides:

```json
{
  "apiKey": "ctx7sk-...",
  "cache": { "resolveTtlHours": 168, "docsTtlHours": 24 }
}
```

Cache lives under `~/.agents/context7/cache/`.

## Scripts

Run from any cwd as `node <skill-dir>/scripts/<name>.mjs …`.

| Script | Usage |
|--------|--------|
| `docs.mjs` | `node scripts/docs.mjs --name <lib> [--query <q>] [--topic <t>] [--page <n>]` or `--id </org/lib>` |
| `resolve.mjs` | `node scripts/resolve.mjs <libraryName> [--query <intent>]` |
| `raw.mjs` | `node scripts/raw.mjs --doc-ref <ref>` |

Deep docs: `reference/docs.md`, `reference/resolve.md`, `reference/raw.md`.

## Workflow

1. Call `docs.mjs --name <lib> --query "..."` before writing code against a third-party API.
2. If auto-resolve is ambiguous, run `resolve.mjs`, pick an ID, then `docs.mjs --id </org/lib>`.
3. When the curated excerpt omits detail, pass the printed `docRef` to `raw.mjs`.
4. A `(cache hit)` marker on `docs.mjs` means the local cache served a fresh entry (default docs TTL 24h).
