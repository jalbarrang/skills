# read.mjs / thread.mjs

## read.mjs

Channel history via `conversations.history`.

```
node scripts/read.mjs <channel> [--oldest ts] [--latest ts] [--limit N] [--cursor c]
```

- `<channel>` — channel ID (`C…`).
- `--limit` — max messages (1–100). Default from `.agents/slack.json` `messageLimit` (50).
- `--oldest` / `--latest` — Unix timestamp bounds.
- `--cursor` — pagination cursor.

Each message prints as `[time UTC] **user** [N replies]: text` plus reaction tokens and `📎 filename (fileId)` lines for attachments.

## thread.mjs

Thread replies via `conversations.replies`.

```
node scripts/thread.mjs <channel> <thread_ts> [--limit N] [--cursor c]
```

- `<thread_ts>` — parent message timestamp (also used as `thread_ts` when posting replies).

Both commands print `Next cursor: …` when Slack returns another page. Large payloads also write full JSON to a temp file and print `Full JSON: <path>`.

Requires `SLACK_BOT_TOKEN` with the matching history scopes (`channels:history` / `groups:history` / `im:history`) and bot membership in the channel.
