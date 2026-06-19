---
name: handoff
description: Distill the current conversation into a self-contained handoff prompt for a fresh chat. Use when a thread has grown long or is about to be compacted, when switching to a new focused task, or when the user says "hand off", "start a new thread", "carry this over", or "summarize this for a new chat".
---

# Handoff

Compaction is lossy — it shrinks history without knowing what the next task
needs. A handoff is the opposite: it extracts exactly what the *next* task needs
and packages it as a prompt you can paste into a fresh chat that has zero prior
context.

## When to use

- The current thread is long, slow, or near its context limit.
- You're pivoting to a related but distinct task ("now do this for teams too",
  "execute phase one", "check the other call sites").
- You want a clean chat that still knows the decisions already made.

## Input

The user states the **goal for the new thread** — what they want to do next.
If they don't, ask one short question: "What's the next task for the new chat?"

## Process

1. Review the conversation so far: what was built or decided, which files were
   read or modified, what approach was chosen and what was rejected.
2. Produce a **self-contained prompt** for the new thread. It must stand alone —
   the new chat cannot see this conversation.
3. Output it in a fenced code block so the user can copy it verbatim. Do **not**
   add preamble like "Here's the prompt" — the block is the deliverable.

## Output format

````
## Context
We've been working on <X>. Key decisions:
- <decision 1>
- <decision 2>

Files involved:
- path/to/file1.ts — <what it is / what changed>
- path/to/file2.ts — <what it is / what changed>

Relevant constraints / gotchas:
- <constraint or gotcha discovered along the way>

## Task
<Clear, specific description of what to do next, based on the user's goal.>
````

## Rules

- **Self-contained.** Include every decision, file path, and constraint the new
  thread needs. Assume it knows nothing.
- **Concise but complete.** Summarize; don't transcribe. Drop dead ends unless
  they explain why an approach was rejected.
- **Real paths.** List actual file paths that were touched or discussed, with a
  one-line note on each.
- **Lead with the task.** The `## Task` section is the point — make it concrete
  and actionable, not a vague theme.
- **Offer to edit.** After producing the block, let the user tweak the goal or
  scope before they start the new chat.
