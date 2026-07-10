# channels.mjs

List text-like channels (text, announcement, threads, forum) in a guild via `GET /guilds/{guild.id}/channels`.

```
node scripts/channels.mjs [--guild <id>]
```

- `--guild` — guild (server) snowflake. Falls back to `defaultGuild` in `.agents/discord.json` / `~/.agents/discord.json` / `.pi/discord.json`.
- If neither `--guild` nor `defaultGuild` is set, the script exits 1 with an actionable error.

Output lines look like `# **name** (id)` (📣 announcement, 🧵 thread, 🗂️ forum). Requires `DISCORD_BOT_TOKEN` and bot membership in the guild with View Channel.
