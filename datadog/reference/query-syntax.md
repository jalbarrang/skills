# Datadog query syntax

## Logs

Datadog log query syntax examples:

- `status:error` — error-level logs
- `@http.status_code:500` — HTTP 500 responses
- `service:my-api` — scope to a service
- `env:prod` — scope to an environment
- Free-text: `error connecting to database`

`logs.mjs` auto-appends project defaults from `.agents/datadog.json` when the query does not already constrain that dimension:

- `service:<config.service>` unless the query contains `service:`
- `env:<config.env>` unless the query contains `env:`
- each `defaultTags` entry unless the query already has that tag key (`key:`)

Override with `--service` / `--env`, or put the facet in the query string.

Prefer one narrow query over many broad ones — Datadog is rate-limit sensitive.

## RUM

RUM query syntax examples:

- `@type:session` — user sessions (default when `@type` is omitted)
- `@type:error` — front-end errors
- `@type:view` / `@type:action` — views and actions
- `@view.url_path:/checkout` — views on a path
- `@session.type:user` — real-user sessions

`rum.mjs` auto-appends:

- `@type:session` unless the query already includes `@type:`
- `@application.id:<rumApplicationId>` unless the query includes `@application.id:`
- `service:<rumService|service>` unless the query includes `service:`
- `env:<env>` and `defaultTags` the same as logs

Override with `--application-id`, `--service`, `--env`.
