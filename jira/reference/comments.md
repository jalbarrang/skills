# comments.mjs

```bash
node <skill>/scripts/comments.mjs <key> [--limit N]
```

## Arguments

- `key` — work item key such as `PROJ-123`. Bare numeric keys use `defaultProject` from config when set.
- `--limit` — max comments to fetch (1–100). Default 50.

## Output

Stdout digest shows total comment count and the most recent 3 bodies (each truncated to 200 chars), plus the temp file path when the thread is non-empty. The temp file holds the full untruncated thread (author, timestamps, ids, bodies with ADF flattened to plain text).

Empty threads print `<key>: no comments.` with no temp file.

## Errors

Missing or unauthenticated acli prints one actionable stderr line telling the user to install acli / run `acli jira auth login`, then exits 1. Missing `key` prints usage to stderr and exits 1.
