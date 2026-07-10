# Time formats

`--from` and `--to` accept:

| Form | Example | Meaning |
|------|---------|---------|
| Relative | `15m`, `1h`, `4h`, `7d` | That many minutes/hours/days ago from now |
| ISO 8601 | `2026-07-10T12:00:00Z` | Absolute instant |
| `now` | `now` | Current time (typical `--to` default) |

Units for relative forms: `m` (minutes), `h` (hours), `d` (days). No other units.

## Defaults

- `--from` defaults to `defaultTimeRange` from `.agents/datadog.json`, or `1h` if unset
- `--to` defaults to `now`
- `--limit` defaults to `25` (capped at `100`)
- `--sort` defaults to `newest` (`-timestamp`); use `oldest` for ascending

## Examples

```bash
node <skill>/scripts/logs.mjs --query "status:error" --from 15m
node <skill>/scripts/logs.mjs --query "status:error" --from 24h --limit 50
node <skill>/scripts/rum.mjs --query "@type:error" --from 2026-07-10T00:00:00Z --to now
```
