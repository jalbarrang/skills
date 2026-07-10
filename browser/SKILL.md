---
name: browser
description: Search the web, read a page as markdown, screenshot pages, interact with a page (click/type/scroll/select/hover/wait), check console errors, and attach via CDP. Use when the user asks to search online, open/visit a URL, scrape readable content, take a screenshot, drive a browser UI, inspect console output, or connect to a running Chrome with remote debugging.
---

# browser

Two thin Node scripts for search + static page fetch, plus direct `agent-browser` for everything interactive. Screenshots are image files — the harness's own vision reads them (the pi extension's `analyze` vision flag does **not** port).

## Setup

1. Confirm CLI: `which agent-browser` (expected `/opt/homebrew/bin/agent-browser` or similar).
2. Install browser binaries once: `agent-browser install`
3. Optional keys in `.agents/browser.json` or `~/.agents/browser.json` (strings starting with `$` pull from env):

```json
{
  "WEB_SEARCH_PROVIDER": "ddg",
  "GOOGLE_CSE_API_KEY": "$GOOGLE_CSE_API_KEY",
  "GOOGLE_CSE_ID": "$GOOGLE_CSE_ID",
  "BRAVE_SEARCH_API_KEY": "$BRAVE_SEARCH_API_KEY"
}
```

Config key names match the pi extension: `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_ID`, `BRAVE_SEARCH_API_KEY`, `WEB_SEARCH_PROVIDER`. DuckDuckGo needs no key and is the default.

## Routing

| Need | Use |
|------|-----|
| Search | `node <skill>/scripts/search.mjs "<query>"` |
| Static / mostly-HTML page → markdown | `node <skill>/scripts/visit.mjs <url>` |
| JS-heavy SPA / login / interaction | `agent-browser` directly (see `reference/agent-browser.md`) |
| Screenshot | `agent-browser open <url> && agent-browser screenshot /tmp/page.png` then `read` the file with vision |

## Scripts

```bash
node <skill>/scripts/search.mjs "<query>" [--engine ddg|google|brave] [--allow a.com,b.com] [--block x.com] [--limit N]
node <skill>/scripts/visit.mjs <url> [--render]
```

`--render` shells out to `agent-browser open` + `agent-browser read` (rendered DOM). Prefer direct agent-browser for multi-step interaction.

## Extraction fidelity

`visit.mjs` (default) uses a dependency-free extractor: strips `script`/`style`/`nav`/`header`/`footer`/`aside`, then converts headings, paragraphs, links, lists, code, and tables to markdown. It is **not** Mozilla Readability + Turndown — chrome may leak, nested markup can flatten, and complex layouts lose structure. For JS-rendered content use `--render` or agent-browser.

## References

| File | When |
|------|------|
| `reference/agent-browser.md` | open/navigate, screenshot, interact, console, CDP |
