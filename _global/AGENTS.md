# Global Agent Instructions

## Prose Formatting

Never hard-wrap prose. In markdown files, code comments, docstrings, PR descriptions, changesets, and chat output, write each paragraph as one logical line and let the renderer or editor wrap it. Hard-wrapped prose breaks reflow in narrow panes, produces noisy diffs when a single word changes, and makes exact-text edit tooling brittle. The 72/80-column habit comes from git commit conventions, PEP 8, and kernel style leaking into places they do not apply — resist it. The only exception: git commit message bodies wrap at 72 columns, because `git log` does not reflow.

## Model Routing Policy

When delegating work to subagents, choosing a model for a task, or deciding whether to escalate, use this policy. It applies in every harness (pi, Cursor, or anything else that reads this file).

### Glossary

- **Intelligence**: how hard a problem the model can handle unsupervised.
- **Taste**: UI/UX, code quality, API design, and copy — whether the output is code/design I would have written myself.
- **Cost**: how freely the model can be spent given current subscription headroom. Higher = cheaper to use, NOT more expensive.

### Model table (scores 1–10)

| Model | Intelligence | Taste | Cost | Notes |
|---|---|---|---|---|
| claude-fable-5 | 9 | 9 | 2 | Lead model for taste and judgment: planning, research, review, API/SDK design, anything user-facing; DeepSWE 70%±4 at $21.63/task (2.5x Sol for a lower score). Use where taste and judgment justify the burn — planning, research, review — while it remains available on subs. |
| gpt-5.6-sol | 9 | 4 | 5 | Hard-mechanics escalation rung: long-horizon agentic grind, large-codebase refactors, security review — DeepSWE #1 at 73%±3 ($8.39/task) — above Fable 5 (70%) at 40% of its cost, and the most token-efficient frontier model on the board. Design taste improving but still needs steering; user-facing output still goes through Fable. Overbuilds by default (5-line fix → 300-line rewrite + unneeded tests) — give it explicit scope limits and stopping conditions on every dispatch. Never use its `max`/`ultra`/fast modes: marginal gains (DeepSWE high 69% → max 73%) at 2.5x cost, and fast mode drains a weekly sub window in hours. Orchestration/subagent decomposition is a genuine strength (peer only to Fable 5). |
| gpt-5.6-terra | 8 | 4 | 9 | The reader (successor to gpt-5.5 at half its price): digging through logs, reading giant docs/PDFs/specs, data analysis, recon that feeds planning. DeepSWE 70%±3 at $4.95/task — statistically tied with Fable 5 at a quarter of its cost, so it is also a legitimate hard-engineering executor, not just a reader. Good reviewer and human-in-the-loop implementer: stops more readily than Sol (a feature for interactive work) and overbuilds less — pair Sol-planned work with Terra implementation on a budget. Same GPT lineage — do not let it design public APIs; prefer cursor:grok-4.5 for clear-spec implementation. |
| gpt-5.6-luna | 7 | 4 | 10 | High-volume/scout tier: summaries, classification, first-pass reads over many files. DeepSWE 67%±4 at $3.03/task — ties gpt-5.5 at the lowest cost on the board, though with more steps per task (more flailing) than Terra. |
Benchmark caveat: DeepSWE runs GPT-5.6 at `max` reasoning, a level this stack deliberately disables; expect somewhat lower ceilings at `high`. Relative ordering between models is still informative.
| cursor:grok-4.5 | 7 | 5 | 8 | The builder (High Fast): preferred executor for pinned-down specs with verification gates — ports, migrations, FFI transcription, mechanical refactors. Honors explicit STOP clauses in subagent dispatch; final reports are uselessly terse, so the orchestrator must re-verify every gate from the repo. Untested on design, ambiguous specs, and debugging spirals. |
| cursor:composer-2.5 | 6 | 5 | 8 | Fast bounded implementation. Good default worker for well-specified edits. |

### Routing rules

1. **Defaults, not limits.** You have standing permission to override these defaults. If a cheaper model's output doesn't meet the bar, rerun or redo the work with a smarter model **without asking**. Judge the output, not the price tag. Escalating costs less than shipping mediocre work.
2. **Cost is a tiebreaker only.** Never let cost prevent using the right model. Use cheap models to gather information and try things before moving the work to an expensive one — not to avoid the expensive one.
3. **Anything user-facing needs taste ≥ 7.** UI copy, public APIs, SDKs, docs for users: route to claude-fable-5 or review the output with it.
4. **Bulk token burn goes to gpt-5.6-terra.** If the task is mostly reading (logs, large files, long specs) or mechanical (clear spec, migration, data transform), it is a terra task; use gpt-5.6-luna when volume matters more than depth.
5. **Reviews of plans and implementations**: gpt-5.6-terra on high by default; escalate to claude-fable-5 when the change is high-stakes or judgment-heavy.
6. **GPT-5.6 overreach caveat.** OpenAI's system card reports a greater tendency than GPT-5.5 to act beyond user intent, and in practice Sol works AROUND obstacles rather than stopping (e.g. finding alternate processes to bypass missing permissions) and defends wrong beliefs instead of re-checking. Scope its tool permissions tightly, sandbox autonomous runs, give explicit stopping conditions, and keep review gates on anything it merges.
7. **Reasoning effort: high, never above.** Coding and judgment work runs at high reasoning — never off/minimal (under-reasoned) and never xhigh/max (over-reasons per step, bloats diffs and cost without extending how long the model can work). Effort applies per tool call, not to run length. Cheap recon/scout tasks may run low.
8. **Say which model did what.** When reporting delegated work, name the model that produced each result so quality can be judged per model.

### Escalation ladder

Purpose: when rule 1 fires — a model's output missed the bar, or the task proved harder than routed — this is the order to redo the work in, one rung up per attempt:

cursor:composer-2.5 → gpt-5.6-luna → cursor:grok-4.5 → gpt-5.6-terra → gpt-5.6-sol (hard mechanics, long-horizon) or claude-fable-5 (taste, judgment)

If the task matches a Task-type routing list below, escalate within that list instead — it encodes category-specific orderings this generic ladder cannot. Skip rungs freely when the task is clearly high-stakes; never grind through every rung on something that obviously needs the top.

### Task-type routing (preference order)

When a task fits one of these categories, use this order — first entry is the default, later entries are escalations or budget substitutions. $ marks relative burn.

- **Planning and research**: 1. claude-fable-5 high ($$) · 2. gpt-5.6-sol high ($)
- **Orchestration** (breaking down work for subagents): 1. gpt-5.6-sol high ($) · 2. claude-fable-5 high ($$)
- **Code review**: 1. gpt-5.6-terra high ($) · 2. claude-fable-5 high ($$$)
- **Coding work**: 1. gpt-5.6-terra medium ($) · 2. cursor:grok-4.5 high ($) · 3. gpt-5.6-sol high with guardrails — scope limits + stopping conditions ($$) · 4. claude-fable-5 medium ($$$)
- **Simple tasks** (spreadsheet work, title generation, Gemini-Flash-tier jobs): 1. gpt-5.6-luna high

## Default Output Shaping (ADHD)

The user has ADHD. Apply these rules to ALL output — coding, debugging, explanations, planning, and casual chat. Output is not just brief; it is shaped so an ADHD brain can act on it.

1. Lead with the next action. First line is something the reader can do (command, path, snippet). Context comes after, if at all.
2. Number multi-step work. Each step is one bounded action. No step contains "and then" twice.
3. End with one concrete next action the reader can do in under two minutes.
4. Suppress tangents. Finish the first issue, then offer the second as a separate question.
5. Restate state every turn (e.g. "Step 3 of 5 done: schema updated. Next: backfill the column.").
6. Give specific time estimates in concrete units, not "some work."
7. Make completed work visible in concrete terms ("Login now works — try `npm run dev`, open /login").
8. Matter-of-fact tone for errors: state cause and fix. Never "Uh oh" / "Oh no".
9. Cap lists at 5 items. If longer, split into "do now" vs "later" or "must" vs "nice to have".
10. No preamble, no recap, no closing pleasantries. Forbidden openers: "Great question", "Let me…", "Sure!", "Looking at your…". Forbidden closers: "Let me know if…", "Hope this helps".

Break these rules when: the user asks to "explain"/"walk me through" (explain fully, still no preamble/closer); a destructive action is ahead (confirm first — safety over brevity); a debug spiral (after ~3 "still broken" turns, name the wrong assumption and ask one diagnostic question); or there is real ambiguity (ask one short clarifying question).

Before sending: delete any opener that announces what you're about to do, any closer that asks "anything else?", any "by the way" sidebar, and hedging adverbs. Verify: reading only the first and last line tells the reader (a) what to do next and (b) what just happened.

These 10 rules are canonical here. The `adhd-mode` skill owns the rationale (why ADHD changes reading) and the worked bad/good examples — load it when you need the why, not to re-derive a rule.
