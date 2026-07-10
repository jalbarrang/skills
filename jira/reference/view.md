# view.mjs

```bash
node <skill>/scripts/view.mjs <key> [--fields <csv>]
```

## Arguments

- `key` — work item key such as `PROJ-123`. A bare number (digits only) is qualified with `defaultProject` from config when set (`123` → `PROJ-123`). Already-qualified keys (containing a dash) are left unchanged.
- `--fields` — optional comma-separated acli field set overriding `viewFields` from config. Example: `summary,status,comment` or `*all`.

## Config keys

| Key | Default | Role |
|-----|---------|------|
| `acliPath` | `acli` | Binary name or absolute path |
| `defaultProject` | unset | Qualifies bare numeric keys |
| `viewFields` | curated summary/status/description/comment set | Passed to `acli jira workitem view --fields` |

## Output

Stdout digest includes key, summary, type/status/priority/assignee, truncated description (≤600 chars), comment count, and the temp file path. The temp file is markdown with the full description and every comment body (ADF flattened to plain text).

## Errors

Missing or unauthenticated acli prints one actionable stderr line telling the user to install acli / run `acli jira auth login`, then exits 1. Missing `key` prints usage to stderr and exits 1.
