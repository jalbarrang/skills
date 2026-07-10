# raw.mjs

Print the full raw cached Context7 document for a `docRef` produced by `docs.mjs`. Use when the curated excerpt dropped detail you still need.

## Usage

```bash
node scripts/raw.mjs --doc-ref ctx7:docs:abc123...
```

## Flags

- `--doc-ref <ref>` (required) — exact `docRef` from a prior `docs.mjs` run.

## Notes

Looks up `~/.agents/context7/cache/docs/objects/`. No API key required. Exits 1 with an actionable message if the ref is missing — run `docs.mjs` first.
