---
name: slack
description: Read Slack channels and threads, search the workspace, post/edit/delete bot messages, and download shared files via the Slack Web API. Use when the user asks to read Slack, list channels, fetch channel history, open a thread, search Slack messages, download a Slack file or image, post to Slack, edit a bot message, delete a bot message, or work with SLACK_BOT_TOKEN / SLACK_USER_TOKEN.
---

# slack

Self-contained Slack Web API skill. Scripts use Node ≥20 `fetch` only — no npm dependencies.

## Setup

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps) and install it to the workspace.
2. Set env tokens (secrets stay in the environment, never in JSON config):

```bash
export SLACK_BOT_TOKEN=xoxb-...   # required for most commands
export SLACK_USER_TOKEN=xoxp-...  # required for search only
```

3. Bot token scopes (`SLACK_BOT_TOKEN`): `channels:read`, `channels:history`, `groups:read`, `groups:history`, `im:history`, `files:read`, `chat:write`.
4. User token scope (`SLACK_USER_TOKEN`): `search:read` (bots cannot call `search.messages`).
5. Invite the bot into each channel it should read or post to (`/invite @app`). Otherwise history/post returns `not_in_channel`.
6. Optional non-secret defaults in `.agents/slack.json` (project) or `~/.agents/slack.json`:

```json
{
  "defaultChannel": "C0123ABC456",
  "messageLimit": 50
}
```

IDs: channel IDs look like `C0123ABC456`; thread/message timestamps look like `1512085950.000216`. Edits and deletes only work on messages the bot itself posted.

## Scripts

Run from any cwd as `node <skill-dir>/scripts/<name>.mjs …`.

| Script | Usage |
|--------|--------|
| `channels.mjs` | `node scripts/channels.mjs [--types t] [--limit N] [--cursor c]` |
| `read.mjs` | `node scripts/read.mjs <channel> [--oldest ts] [--latest ts] [--limit N] [--cursor c]` |
| `thread.mjs` | `node scripts/thread.mjs <channel> <thread_ts> [--limit N] [--cursor c]` |
| `search.mjs` | `node scripts/search.mjs <query> [--count N] [--sort score\|timestamp] [--sort-dir asc\|desc]` |
| `download.mjs` | `node scripts/download.mjs <fileId>` |
| `post.mjs` | `node scripts/post.mjs <channel> <text> [--thread ts] [--broadcast]` |
| `edit.mjs` | `node scripts/edit.mjs <channel> <ts> <text>` |
| `delete.mjs` | `node scripts/delete.mjs <channel> <ts>` |

Deep docs: `reference/channels.md`, `reference/messages.md`, `reference/search.md`, `reference/files.md`, `reference/posting.md`.

## Workflow

1. List channels with `channels.mjs` to get IDs.
2. Read with `read.mjs` / `thread.mjs`; when a message shows `📎 name (F…)`, download with `download.mjs`.
3. Search with `search.mjs` only when `SLACK_USER_TOKEN` is set.
4. Post/edit/delete sparingly; confirm channel membership and that edits/deletes target the bot's own `ts`.

Large read/search payloads print a digest and also write full JSON under the OS temp dir (path printed on stdout).
