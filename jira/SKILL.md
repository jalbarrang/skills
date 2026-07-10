---
name: jira
description: View, search, and comment on Jira work items via the Atlassian CLI (acli). Use when the user mentions a Jira ticket key, JQL, pulling a ticket into context, reading a comment thread, posting a Jira comment, or looking up work items by project/status/assignee.
---

# jira

Read and write Jira work items through authenticated `acli`. Scripts print a compact digest to stdout and write the full payload to a temp file — `read` the printed path when you need the complete description or comment thread.

## Setup

1. Install the Atlassian CLI (`acli`) and put it on `PATH`: https://developer.atlassian.com/cloud/acli/
2. Authenticate once: `acli jira auth login`
3. Optional project config at `.agents/jira.json` (or `~/.agents/jira.json`):

```json
{
  "defaultProject": "PROJ",
  "searchLimit": 25,
  "viewFields": "summary,issuetype,status,priority,assignee,reporter,labels,components,parent,description,comment,created,updated",
  "acliPath": "acli"
}
```

Bare numeric keys (e.g. `123`) resolve to `PROJ-123` when `defaultProject` is set. If a script reports missing/unauthenticated acli, tell the user to install acli and run `acli jira auth login`.

## Output contract

Every read script prints a human-readable digest inline, then a line with the absolute path of a temp file under `os.tmpdir()` holding the full untruncated payload. Prefer `read` on that path over re-fetching when you need the whole description or thread.

## Scripts

Resolve `<skill>` to this skill's directory. Invoke with Node ≥ 20.

### View a ticket

```bash
node <skill>/scripts/view.mjs <key> [--fields <csv>]
```

Fetches description + comments. Digest on stdout; full ticket in the temp file. See `reference/view.md`.

### Search with JQL

```bash
node <skill>/scripts/search.mjs "<jql>" [--limit N]
```

Compact key/status/summary list on stdout; full results (with descriptions) in the temp file. Default limit is `searchLimit` from config or 25. See `reference/search.md`.

### Read comments

```bash
node <skill>/scripts/comments.mjs <key> [--limit N]
```

Most-recent comment digest on stdout; full thread in the temp file. Default limit 50. See `reference/comments.md`.

### Post a comment

```bash
node <skill>/scripts/comment.mjs <key> "<body>"
```

**Etiquette:** comments are visible to the whole team and cannot be unsent cleanly. Confirm the exact wording with the user before posting unless they explicitly asked you to post. Keep comments concise and factual. See `reference/comment.md`.

## When to load references

| File | When |
|------|------|
| `reference/view.md` | Flags, field overrides, bare-key qualification |
| `reference/search.md` | JQL examples, limit/config keys |
| `reference/comments.md` | Comment-list flags and digest behavior |
| `reference/comment.md` | Posting rules and confirmation checklist |
