# review — run a bug-focused review

Engine: one **context-rich discovery pass** (`bug-finder`) followed by a
**skeptical verifier** (`bug-verifier`). The project context, not pass
redundancy, is the source of signal.

## Step 1: Resolve the target

- Default: `git diff main...HEAD`. If the user named a base, branch, or path, use
  it (e.g. `review src/auth` → diff scoped to that path; `review v2..HEAD` → that
  range).
- If the diff is empty, report "no changes to review" and stop.
- Enumerate changed files and read each one in full — not just the hunks.

## Step 2: Discovery (single pass)

Invoke the `bug-finder` subagent with: the diff, the full changed files, and the
contents of `.code-reviewer/context.md` (or a note that it's absent →
`generalized` mode).

The finder casts a wide net within these categories only: logic,
state-management, null-safety, control-flow, security, concurrency, type-safety,
error-handling. It excludes style, naming, comments, docs, formatting, import
ordering, and optional refactors. Each finding carries: `file`, `lineRange`,
`category`, `severity` (1-10), `confidence` (0-100), `summary`, `reasoning`.

## Step 3: Verification (conditional gate)

Verification is the false-positive killer, but it costs a second subagent pass.
Run it only when the findings warrant the cost.

**Skip the verifier entirely when** the finder returned `No findings`, OR every
finding is `severity < 5` AND none of their files/areas appear in the context's
**Critical invariants** or **Historical bug classes**. In that case, report the
findings (all Minor) tagged `unverified — below verification threshold`, note the
diff was low-risk, and skip to Step 4.

**Otherwise run the `bug-verifier` subagent** — i.e. whenever ANY finding has
`severity >= 5`, OR touches a file/area named under the context's critical
invariants or historical bug classes. Pass it the full finding set (not just the
triggering ones) so low-severity findings near a high-stakes change are checked
too. The verifier must:

- Re-read 100+ lines of context around each finding.
- Trace reachability — is the buggy path actually reachable?
- Check for existing guards, validators, and covering tests.
- **Cross-check the context's "intentional patterns" — drop any finding that
  matches a documented false-positive suppressor.**
- Re-score severity and confidence; drop anything below `confidence < 50`.

Output per finding: `CONFIRMED` (with updated scores + evidence) or `DISMISSED`
(with a one-line reason).

## Step 4: Tiered report

Group findings (verified scores when the verifier ran; finder scores otherwise):

- **Critical** — `severity >= 8` and `confidence >= 70`
- **Important** — `severity >= 5` and `confidence >= 60`
- **Minor** — `severity >= 3` and `confidence >= 50`

A finding lands in the highest tier whose thresholds it meets. Tag any finding
that skipped verification (Step 3 gate) as `unverified`. Also include:

- **Dismissed** — each with its one-line reason (only when the verifier ran).
- **Context mode** — `project-specific` (context was used) or `generalized`
  (context absent; recommend `/code-reviewer init`).
- **Verification** — `ran` or `skipped (low-risk diff)`, so the reader knows
  whether findings were independently checked.
- **Metadata** — files reviewed, findings from discovery, findings after
  verification (or `n/a` when skipped), final count.

If there are no confirmed findings, say so plainly — do not invent concerns.

## Step 5: Close the loop

If the user pushes back ("that's intentional" / "you missed X"), offer
`/code-reviewer learn` so the correction becomes a durable invariant in the
context and the next review won't repeat the mistake.
