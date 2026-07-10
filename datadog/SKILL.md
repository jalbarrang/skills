---
name: datadog
description: Search Datadog logs and RUM events via the Datadog HTTP API. Use when searching Datadog logs, inspecting RUM sessions/errors, debugging production issues, querying status:error or @http.status_code, or looking up front-end session/view/action events.
---

# datadog

Search production logs and RUM events. Scripts print a compact digest to stdout and write full JSON events to a temp file — `read` the printed path when you need complete messages or attributes.

## Setup

1. Export API credentials (or put them in a project `.env`; shell env wins):

```bash
export DD_API_KEY=...
export DD_APP_KEY=...
```

2. Optional project config at `.agents/datadog.json` (or `~/.agents/datadog.json` / `.pi/datadog.json`):

```json
{
  "site": "us5.datadoghq.com",
  "service": "my-api",
  "env": "prod",
  "defaultTimeRange": "1h",
  "defaultTags": [],
  "rumApplicationId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "rumService": "my-frontend"
}
```

`site` defaults to `datadoghq.com`. Secrets stay in env vars — never in the JSON file.

Debugging: set `DD_DRY_RUN=1` to print the would-be request URL + JSON body without calling Datadog.

## Scripts

Resolve `<skill>` to this skill's directory. Invoke with Node ≥ 20.

### Search logs

```bash
node <skill>/scripts/logs.mjs --query "status:error" [--from 1h] [--to now] [--limit 25]
```

Applies config `service` / `env` / `defaultTags` when the query does not already set them. Default time range is `defaultTimeRange` from config (or `1h`). See `reference/query-syntax.md` and `reference/time-formats.md`.

### Search RUM

```bash
node <skill>/scripts/rum.mjs --query "@type:error" [--from 1h] [--to now] [--limit 25]
```

Defaults to `@type:session` when the query omits `@type`. Applies `rumApplicationId`, `rumService` (or `service`), `env`, and `defaultTags` the same way. Optional `--application-id`, `--service`, `--env`, `--sort newest|oldest`.

## Output contract

Digest on stdout (timestamp / service / status or type / excerpt). Full JSON events in a temp file under `os.tmpdir()` — path printed at the end. Prefer `read` on that path over re-querying.

## When to load references

| File | When |
|------|------|
| `reference/query-syntax.md` | Log/RUM query examples and auto-scoping rules |
| `reference/time-formats.md` | Relative vs ISO time inputs |
