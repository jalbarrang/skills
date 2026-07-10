---
name: firestore
description: Read Firestore data from the command line — list collections, query documents with filters, fetch a document by path, count documents, and map relations between collections. Use when the user asks to inspect Firestore, query a collection, check a document, count matching documents, or explore the data model of a Firebase project.
---

# firestore

Read-only Firestore access through the published `@dreki-gg/firestore-cli` package. No scripts ship with this skill — every command runs via npx:

```
npx -y @dreki-gg/firestore-cli <command>
```

## Setup

1. Config file — `.agents/firestore.json` in the project, walked up from the working directory:

```json
{
  "defaultEnvironment": "prod",
  "environments": {
    "dev":  { "projectId": "my-dev-project",  "serviceAccountKeyPath": ".agents/sa.dev.json" },
    "prod": { "projectId": "my-prod-project", "serviceAccountKeyPath": ".agents/sa.prod.json" }
  }
}
```

2. A service-account JSON key at each `serviceAccountKeyPath`. `GOOGLE_APPLICATION_CREDENTIALS` and `.firebaserc` work as fallbacks when no config file exists.

Select a non-default environment with `--env <name>` on any command. Missing config or keys produce an actionable error listing the paths that were tried.

## Commands

```
npx -y @dreki-gg/firestore-cli collections [path]
npx -y @dreki-gg/firestore-cli query <collection> [--where field,op,value]... [--order-by field[,dir]] [--limit n] [--start-after id]
npx -y @dreki-gg/firestore-cli get <docPath>
npx -y @dreki-gg/firestore-cli count <collection> [--where field,op,value]...
npx -y @dreki-gg/firestore-cli relation-map <collection>
```

- `collections` — root collections, or subcollections of a document path like `users/abc123`.
- `query` — `--where` is repeatable; `op` is a Firestore operator (`==`, `!=`, `<`, `<=`, `>`, `>=`, `array-contains`, `in`). Values are coerced (numbers, booleans) automatically.
- `get` — full document path, e.g. `users/abc123`.
- `count` — server-side aggregate count, cheap even on large collections.
- `relation-map` — scans local source code plus sampled field values to infer which collections reference each other.

## Output contract

Every command prints a human digest to stdout. Large result sets are also written to a temp file whose path is printed — `read` that file for the complete JSON.

## Etiquette

This CLI is read-only by design. For writes, use the project's own tooling or the Firebase console — never improvise writes against production data.
