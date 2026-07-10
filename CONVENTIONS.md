# Skills repo conventions

This repo (`github.com/jalbarrang/skills`) publishes agent skills installable via `npx skills@latest add jalbarrang/skills/<name>`. Every skill is a self-contained directory the skills CLI can copy into a harness. Follow these conventions when adding or changing a skill.

## Layout

Each skill lives at the repo root as a fully self-contained directory: `<name>/{SKILL.md,scripts/,reference/}` (plus any skill-local assets such as `agents/`). There are no cross-skill imports. The skills CLI copies **one** skill directory into each harness, so a shared helper must be **copied** into that skill's `scripts/lib/` from the canonical template in `_shared/` (for example `_shared/config.mjs` → `<name>/scripts/lib/config.mjs`). Never `import` from `_shared/` or from another skill at runtime.

## SKILL.md

Frontmatter requires `name` and `description`. The description is the **only** thing an agent sees before invoking the skill, so it must carry every trigger phrase and use-case the skill should match on.

Every skill includes a mandatory **Setup** section covering prerequisites and auth (tokens, CLIs, accounts). Document top-level commands and usage in `SKILL.md`, but keep that file lean — per-command deep docs belong in `reference/*.md` and are loaded on demand when the agent runs that command.

## Scripts

Scripts are Node ≥ 20 ESM (`.mjs`), dependency-free: Node built-ins and the global `fetch` only. Agents invoke them as `node <skill-dir>/scripts/x.mjs`. Resolve sibling paths with `new URL('.', import.meta.url)` (or `fileURLToPath` / `import.meta.url`); never resolve relative to `process.cwd()` or the repo root for skill-owned files. Never throw uncaught — catch errors, print an actionable message to stderr, and `process.exit` non-zero. Heavy dependencies belong in a separately published npm CLI that the skill invokes via `npx <pkg>`.

## Config resolution

Use the shared resolver (`_shared/config.mjs`, copied into each skill as `scripts/lib/config.mjs`). Call `loadConfig(skillName)` to get a merged plain object.

Precedence, highest wins:

1. Project `.agents/<skill>.json` (walk up from `process.cwd()` to filesystem root; first found wins)
2. Global `~/.agents/<skill>.json`
3. Env-var / caller defaults passed into `loadConfig`

Secrets stay in environment variables (for example `SLACK_BOT_TOKEN`). JSON config holds non-secret defaults only (default channel, default Jira project, limits). Any string value that starts with `$` is interpolated from `process.env` (empty string if unset). Malformed JSON in a config file must not crash the script — the resolver prints a one-line warning to stderr and skips that file.

## Output contract

Print a human-readable digest to stdout. Write large payloads to a temp file under `os.tmpdir()` and print the path so the agent can `read` it.

## Ship checklist

Per skill, before calling it done:

1. Add a README entry with the install command: `npx skills@latest add jalbarrang/skills/<name>`
2. Commit and `git push` to `github.com/jalbarrang/skills`
3. Verify in a scratch directory: install with the command above, confirm the skill lands in the expected harness path, and smoke-run any Setup / script entrypoints

## Local dev loop

The vercel-labs `skills` CLI **does** support installing from a local path. Verified variations (all exit 0 with `--list`):

- `npx skills@latest add ./planwork --list` — single skill directory
- `npx skills@latest add /absolute/path/to/skills/planwork --list`
- `npx skills@latest add . --list` — whole repo (discovers every root skill)
- `npx skills@latest add file:///absolute/path/to/skills --list`

For day-to-day iteration against the global agents skills tree, use the repo sync script instead (or as a fallback when you want a straight copy into `~/.agents/skills` without going through the CLI install flow):

```
node deploy.mjs              # copy all repo skills → ~/.agents/skills/<name>
node deploy.mjs --dry-run    # print planned copies only
node deploy.mjs --only name  # sync one skill
```

`deploy.mjs` overwrites matching skill directories under `~/.agents/skills` and **never** deletes or touches directories there that do not correspond to a skill in this repo.
