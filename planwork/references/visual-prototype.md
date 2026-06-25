# Mode: visual-prototype

A prototype is a **convergence artifact**, not a deliverable. When a plan changes
how something looks or behaves, a written plan cannot show the user what they are
agreeing to. Build the prototype while the plan is still soft, show it, and let
the user redirect you before the plan is finalized.

The prototype is **always a real HTML file you author and write to disk** — there
is no special tooling involved. This keeps the flow harness-agnostic: any agent
that can write a file can produce a prototype.

## When to load this

When the plan involves any of:
- New or restyled UI components
- Layout, spacing, or visual-hierarchy changes
- Color, typography, or theming changes
- Interaction states (hover, active, empty, loading, error)

Do **not** use it for backend-only, refactor-only, or otherwise non-visual work.
A prototype for invisible work is noise.

## Process

### 1. Decide there is something to see
If you cannot picture a screen or component changing, skip the prototype.

### 2. Write the HTML file
Author a complete, self-contained HTML document and **write it to
`.plans/_prototypes/<slug>.html`** with the `write` tool. Build it **with full
freedom**: no template engine, no imposed theme — pick your own markup, fonts,
colors, layout, and inline `<style>`/`<script>`. Assume nothing about a host
page; the file must stand alone when opened directly in a browser.

Always write a full document (doctype + `<html>`/`<head>`/`<body>`), never a
fragment.

**Avoid generic boilerplate.** A dark dashboard with a purple accent and a card
is not a design — it is slop. Design something that fits the actual product. For
real design taste, delegate the markup to a `ux-designer` subagent and write its
HTML to the file.

### 3. Get a reaction before finalizing
Tell the user the path (`.plans/_prototypes/<slug>.html`) and ask them to open it
in a browser. Stop and ask what they think. Iterate — rewrite the same file with
revisions — until the visual direction is agreed. Only then move toward creating
the plan.

The plan itself never generates HTML. The prototype lives entirely in the
planning phase; its job is done once the user has reacted.

## Relationship to context.md

The prototype is the visual sibling of `context.md` (see
`references/planning-context.md`). Both are deliberation artifacts that exist to
slow the jump from "read the codebase" to finalizing the plan. Keep `context.md`
current as the written record; use a prototype whenever the decision is visual.
