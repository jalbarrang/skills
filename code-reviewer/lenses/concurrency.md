# Concurrency

Find race conditions, ordering hazards, and shared-state bugs introduced by the diff — including async/await gaps in single-threaded runtimes.

## Criteria

- **Check-then-act races (TOCTOU)** — a condition checked, then acted on after an interleaving point (`await`, lock release, I/O) that can invalidate it: existence checks before create, balance checks before debit.
- **Non-atomic read-modify-write** — shared state (memory, cache, DB row, file) read, modified, and written back without a lock, transaction, atomic operation, or compare-and-swap.
- **Unawaited/floating promises** — async calls whose result or failure is dropped, causing silent error loss or completion-order assumptions.
- **Await gaps in mutating sequences** — an invariant held across multiple `await`s while other callers can observe or mutate the intermediate state.
- **Shared mutable module state** — module-level mutable variables touched by concurrent requests/tasks (per-request data cached in module scope is the classic leak).
- **Missing idempotency** — handlers that can be delivered twice (queues, retries, webhooks) performing non-idempotent effects without dedup keys.
- **Deadlock/starvation ordering** — locks or resources acquired in inconsistent order across code paths; blocking calls inside async executors.
- **Concurrent iteration + mutation** — collections mutated while being iterated, or snapshot assumptions broken by callbacks.

Weight by actual concurrency: code the context file says runs single-flight is lower risk; request handlers, queue consumers, and cron overlaps are high risk.

## Severity

- blocker: data corruption, double-spend/double-send, or deadlock on a concurrently executed path
- warning: race with realistic interleaving whose impact is recoverable, or silent error loss from dropped promises
- note: hazard on a path that is currently single-flight but not guaranteed to stay so
