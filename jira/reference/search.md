# search.mjs

```bash
node <skill>/scripts/search.mjs "<jql>" [--limit N]
```

## Arguments

- `jql` — JQL query string (quote it in the shell so spaces survive).
- `--limit` — max results, integer 1–100. Defaults to `searchLimit` from config, or 25.

## Config keys

| Key | Default | Role |
|-----|---------|------|
| `acliPath` | `acli` | Binary name or absolute path |
| `searchLimit` | `25` | Default `--limit` when omitted |

## JQL examples

Atlassian Cloud rejects unbounded queries (e.g. bare `order by updated desc`). Always include a restriction:

```
updated >= -30d ORDER BY updated DESC
project = PROJ AND status = "In Progress"
assignee = currentUser() ORDER BY updated DESC
project = PROJ AND labels = backend
text ~ "rate limit" ORDER BY created DESC
```

Search requests fields `summary,issuetype,status,priority,assignee,reporter,labels,description` so the temp file includes descriptions (acli search defaults omit them).
## Output

Stdout is a compact list: count, then one line per item (`key [status] summary (@assignee)`). When there is at least one hit, a temp file holds the full rendered results (description + comments per item). Empty results print `No matching work items.` with no temp file.

## Errors

Missing or unauthenticated acli prints one actionable stderr line telling the user to install acli / run `acli jira auth login`, then exits 1. Missing JQL prints usage to stderr and exits 1.
