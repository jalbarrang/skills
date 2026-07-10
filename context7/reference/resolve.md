# resolve.mjs

List Context7 library candidates with exact IDs. Prefer `docs.mjs --name` for the common case; reach for this only when auto-resolve is ambiguous or you need to inspect the candidate set.

## Usage

```bash
node scripts/resolve.mjs react --query "hooks"
node scripts/resolve.mjs next.js
```

## Args

- `<libraryName>` (required) — package or library name to search.
- `--query <intent>` — optional task/intent used to rank matches (defaults to the library name).

## Output

Up to 8 candidates with Title, Library ID, Description, and optional snippet/reputation/benchmark/version fields. Marks a recommended ID when the scorer has a clear winner; otherwise notes that auto-resolution is ambiguous.
