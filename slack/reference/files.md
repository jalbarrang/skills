# download.mjs

Download a shared Slack file or image to a temp directory via `files.info` + authenticated GET of `url_private`.

```
node scripts/download.mjs <fileId>
```

- `<fileId>` — Slack file ID (`F…`), usually taken from a `📎 name (F…)` line in `read.mjs` / `thread.mjs` output.

The bot token is sent as `Authorization: Bearer …` on the private URL request. Files land under the OS temp dir (`slack-skill-files/`). Images print a hint to `read` the local path.

Requires `SLACK_BOT_TOKEN` with `files:read`.
