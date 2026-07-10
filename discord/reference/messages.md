# read.mjs

Read channel message history via `GET /channels/{channel.id}/messages`.

```
node scripts/read.mjs <channel> [--limit N] [--before <msgId>] [--after <msgId>]
```

- `<channel>` — channel snowflake (required).
- `--limit` — max messages (1–100). Default from `messageLimit` in config, else 50.
- `--before` — only messages before this message ID (page further back).
- `--after` — only messages after this message ID.

Discord returns newest-first; the script prints **oldest-first**. Each line includes author, UTC timestamp, `[bot]` / `(edited)` markers, reaction counts, and `📎 filename (url)` for attachments. Requires View Channel + Read Message History on the channel.
