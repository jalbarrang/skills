# ADR Format — Compact (default)

This is the default format for most ADRs. A short title and a summary paragraph.

## Template

```md
# {Short title of the decision}

{1-3 sentences: what's the context, what did we decide, and why.}
```

That's it. An ADR can be a single paragraph. The value is in recording *that* a decision was made and *why* — not in filling out sections.

## Optional sections

Only include these when they add genuine value. Most ADRs won't need them.

- **Status** frontmatter (`proposed | accepted | deprecated | superseded by ADR-NNNN`) — useful when decisions are revisited
- **Considered Options** — only when the rejected alternatives are worth remembering
- **Consequences** — only when non-obvious downstream effects need to be called out

## Examples

### Minimal (most common)

```md
# Replace env-var service config with centralized config file

All service credentials move from per-service environment variables to a single ~/.asset-bot/config.json file. We chose a config file over env vars because users shouldn't need to manage a dozen env vars across shell profiles, and a single file is easier to back up and manage from a future settings UI.
```

### With considered options

```md
# Custom agent runtime over adopting Pi packages

We maintain a custom multi-provider LLM runtime rather than adopting @mariozechner/pi-ai. Our agent layer is ~1500 lines of purpose-built code. Pi would bring 10x the code for features we don't use, and lock us to Pi's release cycle.

## Considered Options

- **Adopt @mariozechner/pi-ai wholesale** — rejected. Too much surface area for our needs.
- **Adopt only the provider layer** — deferred. If Pi publishes a minimal provider-only package, worth re-evaluating.
- **Custom implementation (chosen)** — purpose-built, lean, follows the same patterns so migration is low-cost later.
```

## Rules

- **No hard line wrapping.** Write one paragraph per line (soft-wrap) — do NOT hard-break paragraphs at ~80 columns. Hard wraps hurt scannability, diffs, and agent reading. Lists, tables, and code/Mermaid blocks keep their own line structure.
- **One decision per ADR.**
- **Numbers are forever.** Sequential, monotonic, never reused.
- **Keep it short.** If you need more than a paragraph + optional sections, upgrade to [NYGARD-FORMAT.md](NYGARD-FORMAT.md).
- **Context is facts, not arguments.**
- **Consequences are honest.** List the downsides.
