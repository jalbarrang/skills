# docs.mjs

Fetch curated Context7 documentation by library name or exact ID.

## Usage

```bash
node scripts/docs.mjs --name zod --query "schema validation"
node scripts/docs.mjs --id /colinhacks/zod --query "schema validation"
node scripts/docs.mjs --name react --topic hooks --page 2
```

## Flags

- `--name <lib>` — package/library name; auto-resolves to a Context7 ID (exact-name and trust-score ranking).
- `--id </org/lib>` — exact Context7 library ID; skips resolve.
- `--query <q>` — freeform documentation request (default effective query: `overview`).
- `--topic <t>` — optional focus hint appended as `Focus: …`.
- `--page <n>` — logical page ≥ 1 for repeated retrieval.

## Output

Prints a curated excerpt, then `docRef: ctx7:docs:…`. On a fresh cache serve, also prints `(cache hit)`. If name resolution is ambiguous, prints candidates and exits 1 — use `resolve.mjs` or pass `--id`.
