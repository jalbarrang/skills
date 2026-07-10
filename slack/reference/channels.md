# channels.mjs

List Slack channels the bot can see via `conversations.list`.

```
node scripts/channels.mjs [--types t] [--limit N] [--cursor c]
```

- `--types` — comma-separated Slack types. Default `public_channel,private_channel`.
- `--limit` — max channels (1–200). Default 100.
- `--cursor` — pagination cursor from a previous response.

Output lines look like `# **name** (C…) · N members` (🔒 for private). When more pages exist, the digest ends with `Next cursor: …`.

Requires `SLACK_BOT_TOKEN` with `channels:read` and `groups:read`.
