# API Compatibility

Catch breaking changes to surfaces other code depends on: exported functions/types, HTTP/RPC contracts, persisted schemas, and event/message formats.

## Criteria

- **Signature breaks** — exported functions/methods with changed parameter order, types, required-ness, or return shape; TS types narrowed in ways that break existing callers.
- **Removed or renamed exports** — public symbols deleted or renamed without a deprecation path. Check whether the diff updates all internal callers; external callers can't be updated by this diff at all.
- **Behavioral contract changes** — same signature, different semantics: changed defaults, error types thrown, null vs throw on missing, ordering/stability guarantees dropped.
- **Wire-format changes** — HTTP/RPC request/response fields removed, renamed, retyped, or made required; status codes changed; enum values removed while old clients still send/expect them.
- **Persisted-schema breaks** — DB columns/collections renamed or dropped, serialization format changed without a migration or dual-read window for data already written.
- **Event/message contract breaks** — payload shape changes on queues/topics while consumers deployed independently still expect the old shape.
- **Version signaling** — for published packages: does the change class (major/minor/patch) match what the diff actually does? Flag silent majors.

Scope: only surfaces consumed outside the diff's own module — internal helpers freely refactored are not findings. Use the context file's architecture section to decide what is public.

## Severity

- blocker: break in a surface with external or independently deployed consumers (published API, wire format, persisted data, events)
- warning: break in an internal cross-module surface where the diff misses some callers
- note: contract change that is compatible today but removes a documented guarantee
