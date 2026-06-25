# init — set up project review context

Goal: produce `.code-reviewer/context.md` so every later `review` is
project-aware instead of generic. One codebase crawl feeds the whole file.
The output obeys the anti-rot rules documented at the top of
`references/CONTEXT-TEMPLATE.md` — read that template now; it is the shape you
write.

## Step 1: Load current state

- Read `.code-reviewer/context.md` if it exists. **Never overwrite silently** —
  if present, ask whether to refresh the whole file or just fill gaps, and merge
  rather than restart.
- Read `AGENTS.md` / `CLAUDE.md` if present. They already encode invariants and
  gotchas — harvest them instead of re-deriving, and point at them as owners
  rather than copying drift-prone detail.

## Step 2: Scan the codebase (once, thoroughly)

Gather what you can before asking anything:

- **README / docs** — what the system is, how it's deployed, stated guarantees.
- **package/config files** — language, framework, test runner, lint/typecheck
  commands, the base branch convention.
- **Architecture** — the dependency direction (which dirs are low-level vs
  high-level). This drives reachability judgement during review.
- **Tests** — framework, where unit vs integration tests live, common mocking
  patterns. The verifier uses this to decide what counts as coverage.
- **Recent history** — `git log --oneline -30` and any `revert`/`hotfix` commits
  hint at historical bug classes worth recording.

Note what you learned and what is still unclear. Only the unclear parts become
interview questions.

## Step 3: Short interview (2-3 questions per round)

Use the harness's structured question tool when one exists; otherwise ask in chat
and stop for answers. Do **not** infer a full context file and ask for blanket
confirmation. Ask only what the scan couldn't answer. Cover, across rounds:

- **Critical invariants** — what must never break? What's the blast radius?
- **Intentional patterns** — what in this code looks wrong but is deliberate?
  (This is the highest-value answer: it's what stops false positives.)
- **Historical bug classes** — what kind of bug keeps coming back here?
- **Severity calibration** — what would a 9 vs a 5 look like in this codebase?

Propose inferred answers as hypotheses the user confirms — never as finished
facts.

## Step 4: Write `.code-reviewer/context.md`

Only after the user confirms. Fill the `CONTEXT-TEMPLATE.md` sections with
concrete, codebase-specific lines. Apply the anti-rot rules ruthlessly:

- Each invariant names the file that owns/enforces it.
- Delete any section the project hasn't earned — an empty placeholder is worse
  than no section.
- A line that wouldn't change a review decision does not belong.

Create the `.code-reviewer/` directory if needed. Mention whether to commit the
file (recommended: commit it so the whole team's reviews share the context).

## Step 5: Wrap up

Summarize tersely: what was captured, and the 2-3 invariants that will most shape
future reviews. Then recommend the next command:

- `/code-reviewer review` — run a review now against the default diff.
- `/code-reviewer learn` — anytime a review gets a call wrong, fold the lesson
  back into the context.
