# Severity and finding format

Ported from the pi `code-reviewer` extension. Use these conventions when reporting review findings (alongside the existing Critical/Important/Minor tiers from the bug-finder/verifier flow).

## Severity levels

| Level | Meaning |
|---|---|
| `blocker` | Will cause a production incident, data loss, security breach, or broken invariant. Must fix before merge. |
| `warning` | Likely bug under realistic conditions, or a high-risk smell that should be fixed soon. |
| `note` | Worth fixing but not urgent — clarity, defensive hardening, or low-probability edge case. |

Lens markdown may override the definitions under a `## Severity` section:

```md
## Severity
- blocker: What constitutes a blocking issue
- warning: What constitutes a warning
- note: What constitutes a note
```

## Finding JSON shape

Per lens, emit a JSON array of findings:

```json
[
  { "file": "path/to/file.ts", "line": 42, "severity": "warning", "message": "Description" }
]
```

Fields: `file` (required), `line` (optional 1-based), `severity` (`blocker` | `warning` | `note`), `message` (required). Empty array `[]` when a lens has no findings.

## Report line format

When rendering a human digest, prefer:

```
- 🔴 **blocker** `path/to/file.ts:42` — Description
- 🟡 **warning** `path/to/file.ts:10` — Description
- 🔵 **note** `path/to/file.ts` — Description
```

Emoji map: blocker → 🔴, warning → 🟡, note → 🔵.

## Mapping to Critical / Important / Minor

When the bug-finder/verifier path is used (severity 1–10 + confidence), keep the existing tier thresholds in `references/review.md`. When a lens emits `blocker`/`warning`/`note` directly, map: blocker → Critical, warning → Important, note → Minor.
