# comment.mjs

```bash
node <skill>/scripts/comment.mjs <key> "<body>"
```

## Arguments

- `key` — work item key such as `PROJ-123`. Bare numeric keys use `defaultProject` from config when set.
- `body` — plain-text comment. Remaining argv after `key` are joined with spaces, so quoting the body is recommended.

## Etiquette (mandatory)

Comments are visible to the whole team and cannot be unsent cleanly.

1. Unless the user explicitly asked you to post, show the exact wording and get confirmation first.
2. Keep comments concise and factual — a short status update or finding, not a wall of text.
3. Do not post speculative or internal agent reasoning.

## Output

On success, stdout is `Comment added to <KEY>.` Empty body prints an error to stderr and exits 1.

## Errors

Missing or unauthenticated acli prints one actionable stderr line telling the user to install acli / run `acli jira auth login`, then exits 1. Missing args print usage to stderr and exit 1.
