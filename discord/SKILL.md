---
name: discord
description: Read Discord guild channels and message history, and download message attachments via the Discord bot REST API (v10). Use when the user asks to read Discord channels or messages, list guild text channels, download a Discord attachment or image, work with guild/channel/message snowflake IDs, or mentions DISCORD_BOT_TOKEN.
---

# discord

Self-contained Discord bot REST skill. Scripts use Node ≥20 `fetch` only — no npm dependencies. Bot-token READS only (no user automation, no message sends).

## Setup

1. Create a bot at [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Reset Token.
2. Export the token (secrets stay in the environment, never in JSON config):

```bash
export DISCORD_BOT_TOKEN=...
```

3. Invite the bot with **View Channel** and **Read Message History**. It only sees guilds it has joined and channels those permissions allow.
4. Enable Developer Mode (User Settings → Advanced) to copy guild/channel/message snowflake IDs (right-click → Copy ID).
5. Optional non-secret defaults in `.agents/discord.json` (project) or `~/.agents/discord.json`:

```json
{
  "defaultGuild": "123456789012345678",
  "messageLimit": 50
}
```

## Scripts

Run from any cwd as `node <skill-dir>/scripts/<name>.mjs …`.

| Script | Usage |
|--------|--------|
| `channels.mjs` | `node scripts/channels.mjs [--guild <id>]` |
| `read.mjs` | `node scripts/read.mjs <channel> [--limit N] [--before <msgId>] [--after <msgId>]` |
| `download.mjs` | `node scripts/download.mjs <attachment-url>` |

Deep docs: `reference/channels.md`, `reference/messages.md`, `reference/attachments.md`.

## Workflow

1. List channels with `channels.mjs` (pass `--guild` or set `defaultGuild`).
2. Read with `read.mjs`; messages print oldest-first with author, timestamp, reactions, and 📎 attachment URLs.
3. When a message shows `📎 name (https://cdn.discordapp.com/…)`, download with `download.mjs <url>`, then `read` the printed path for images.
