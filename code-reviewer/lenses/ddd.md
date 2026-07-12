# Domain-Driven Design

Protect domain boundaries in the diff: keep domain logic in the domain layer, enforce invariants inside aggregates, and keep the ubiquitous language consistent. Read the Architecture section of `.code-reviewer/context.md` first — it names this project's layers and dependency direction; judge the diff against those, not a textbook layout.

## Criteria

- **Domain layer purity** — domain code (entities, value objects, domain services) newly importing infrastructure (HTTP clients, ORMs, frameworks, filesystem). Dependency direction must point inward.
- **Business logic leaking outward** — new business rules placed in controllers, handlers, resolvers, or UI code instead of the domain model. Flag the rule and where it belongs.
- **Invariants enforced outside the aggregate** — validation or state-transition rules for an entity implemented at call sites instead of inside the aggregate root, allowing other callers to bypass them.
- **Aggregate boundary violations** — code reaching into another aggregate's internals (mutating its children directly) instead of going through its root or a domain event.
- **Anemic operations** — new multi-step mutations orchestrated field-by-field from a service when the aggregate should expose one intention-revealing operation.
- **Ubiquitous language drift** — the diff introduces a second name for an existing domain concept, or reuses a domain term for something different. Name both terms and the owning module.
- **Bounded-context bleed** — types from one context imported directly into another instead of translated at the boundary (anti-corruption layer, mapper, event).

Do NOT flag: pragmatic shortcuts the context file documents as intentional, infrastructure code that is supposed to be infrastructure, or projects whose context shows no layered architecture — say the lens doesn't apply instead of inventing layers.

## Severity

- blocker: an aggregate invariant made bypassable, or domain importing infrastructure in a way that inverts the dependency direction
- warning: business logic in the wrong layer, aggregate-boundary reach-through, bounded-context bleed
- note: naming drift, anemic operation, missing translation at a low-traffic boundary
