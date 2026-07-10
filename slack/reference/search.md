# search.mjs

Full-text search via `search.messages`. Bots cannot search — this command requires `SLACK_USER_TOKEN` with `search:read`.

```
node scripts/search.mjs <query> [--count N] [--sort score|timestamp] [--sort-dir asc|desc]
```

- `<query>` — Slack search syntax (`in:#channel`, `from:@user`, `has:link`, etc.).
- `--count` — results per page (1–100). Default 20.
- `--sort` — `score` or `timestamp` (default `timestamp`).
- `--sort-dir` — `asc` or `desc` (default `desc`).

If `SLACK_USER_TOKEN` is unset, the script exits 1 with an actionable missing-token message.

Large result sets write full JSON to a temp file and print the path after the digest.
