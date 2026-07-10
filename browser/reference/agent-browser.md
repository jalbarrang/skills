# agent-browser cheat sheet

Verified against `agent-browser` 0.31.1 (`agent-browser --help` and each subcommand's `--help`). Prefer `agent-browser skills get core --full` for the CLI's own version-matched guide.

## Open / navigate

```bash
agent-browser open                         # launch, stay on about:blank
agent-browser open https://example.com
agent-browser open example.com             # https:// prepended
agent-browser back
agent-browser forward
agent-browser reload
```

Aliases `goto` / `navigate` require a URL. Global: `--session <name>`, `--headed`, `--headers '<json>'`, `--json`.

## Screenshot

```bash
agent-browser open https://example.com
agent-browser screenshot                   # temp path printed
agent-browser screenshot /tmp/page.png
agent-browser screenshot --full /tmp/full.png
agent-browser screenshot --annotate /tmp/labeled.png
agent-browser set viewport 1280 800        # desktop-ish
agent-browser set viewport 390 844         # mobile-ish
```

Flags: `--full`/`-f`, `--annotate`, `--screenshot-dir <path>`, `--screenshot-format png|jpeg`, `--screenshot-quality 0-100`. The agent reads the image file with harness vision — there is no built-in `analyze` flag in this skill.

## Interact

```bash
agent-browser snapshot -i                  # refs like @e1
agent-browser click @e1
agent-browser type "#search" "hello"
agent-browser fill @e2 "clear then type"
agent-browser scroll down 500
agent-browser select "#country" "US"
agent-browser hover "#menu"
agent-browser wait 2000
agent-browser wait "#ready"
agent-browser wait --load networkidle
agent-browser wait --text "Welcome"
```

## Console / errors

```bash
agent-browser console
agent-browser console --clear
agent-browser errors
agent-browser errors --clear
```

## Page content (rendered)

```bash
agent-browser open https://spa.example
agent-browser read                         # rendered DOM of active tab
agent-browser get text body
agent-browser get html body
agent-browser get title
agent-browser get url
```

## CDP attach

```bash
# Chrome started with --remote-debugging-port=9222
agent-browser connect 9222
agent-browser --cdp 9222 snapshot
```

`connect <port|url>` accepts `9222`, `ws://…`, or `http://…`. Global `--cdp <port>` attaches for that invocation. If a `PI_BROWSER_CDP`-style endpoint is already known, pass the same value to `connect` / `--cdp`. Connected browsers are not auto-closed.

## Session hygiene

```bash
agent-browser close
agent-browser close --all
```
