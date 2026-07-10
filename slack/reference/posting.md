# post.mjs / edit.mjs / delete.mjs

All three require `SLACK_BOT_TOKEN` with `chat:write`. The bot must be a member of the target channel. Bots can only edit or delete their own messages.

## post.mjs

```
node scripts/post.mjs <channel> <text> [--thread ts] [--broadcast]
```

- `<channel>` — channel ID (`C…`) or `#channel-name`.
- `<text>` — message body (Slack mrkdwn).
- `--thread` — parent `ts` to reply in a thread.
- `--broadcast` — when threading, also post the reply to the channel (`reply_broadcast`).

Prints the resulting message `ts` for later edit/delete/thread use.

## edit.mjs

```
node scripts/edit.mjs <channel> <ts> <text>
```

Updates a message the bot previously posted (`chat.update`).

## delete.mjs

```
node scripts/delete.mjs <channel> <ts>
```

Deletes a message the bot previously posted (`chat.delete`).

Do not use these against human messages — Slack will reject with a permission error.
