# review — run a bug-focused review

Engine: resolve a diff target → load lenses → one **context-rich discovery pass** (`bug-finder`) followed by a **skeptical verifier** (`bug-verifier`). The project context and lenses, not pass redundancy, are the source of signal.

## Step 1: Resolve the target

Run the skill's target script from the project under review (replace `<skill-dir>` with this skill's install path):

```
node <skill-dir>/scripts/target.mjs                  # default: uncommitted (staged+unstaged+untracked)
node <skill-dir>/scripts/target.mjs --branch main    # merge-base diff: main...HEAD
node <skill-dir>/scripts/target.mjs --commit <sha>   # that commit's patch
```

- Map user intent: "uncommitted" / no target → default; named base branch → `--branch`; a commit sha → `--commit`. Path-scoped reviews still use the default/branch/commit diff, then filter findings to that path.
- Stdout line 1 is a **temp file path** containing the full diff, changed-file list, and stat. Line 2 is a short digest (`N file(s), +ins/-del`).
- **Read the temp file** with the harness `read` tool. If the diff section is empty, report "no changes to review" and stop.
- Enumerate changed files from the temp payload and read each one in full — not just the hunks.

## Step 2: Load lenses

```
node <skill-dir>/scripts/lenses.mjs
node <skill-dir>/scripts/lenses.mjs --lens code-quality
```

- Discovery matches the pi extension: `.code-review.json` (`lensDir`, default `.code-review/lenses`) and every `*.md` therein. Applicable lenses = `--lens` list, else `defaultLenses`, else all.
- If the script prints the "No lenses configured" message, continue without lens criteria (context-only review). Do not invent lenses; mention that packaged lenses can be enabled via `/code-reviewer init`.
- Otherwise treat the printed markdown as additional review criteria. Severity definitions inside each lens override the defaults in `references/severity.md`.

## Step 3: Discovery (single pass)

Invoke the `bug-finder` subagent with: the diff, the full changed files, lens instructions (if any), and the contents of `.code-reviewer/context.md` (guaranteed present — Setup hard-fails without it).

The finder casts a wide net within these categories only: logic, state-management, null-safety, control-flow, security, concurrency, type-safety, error-handling. It excludes style, naming, comments, docs, formatting, import ordering, and optional refactors. Each finding carries: `file`, `lineRange`, `category`, `severity` (1-10), `confidence` (0-100), `summary`, `reasoning`. When lenses are present, also emit per-lens JSON findings using the shape in `references/severity.md` (`blocker` / `warning` / `note`).

## Step 4: Verification (conditional gate)

Verification is the false-positive killer, but it costs a second subagent pass. Run it only when the findings warrant the cost.

**Skip the verifier entirely when** the finder returned `No findings`, OR every finding is `severity < 5` AND none of their files/areas appear in the context's **Critical invariants** or **Historical bug classes**. In that case, report the findings (all Minor) tagged `unverified — below verification threshold`, note the diff was low-risk, and skip to Step 5.

**Otherwise run the `bug-verifier` subagent** — i.e. whenever ANY finding has `severity >= 5`, OR touches a file/area named under the context's critical invariants or historical bug classes. Pass it the full finding set (not just the triggering ones) so low-severity findings near a high-stakes change are checked too. The verifier must:

- Re-read 100+ lines of context around each finding.
- Trace reachability — is the buggy path actually reachable?
- Check for existing guards, validators, and covering tests.
- **Cross-check the context's "intentional patterns" — drop any finding that matches a documented false-positive suppressor.**
- Re-score severity and confidence; drop anything below `confidence < 50`.

Output per finding: `CONFIRMED` (with updated scores + evidence) or `DISMISSED` (with a one-line reason).

## Step 5: Tiered report

Group findings (verified scores when the verifier ran; finder scores otherwise):

- **Critical** — `severity >= 8` and `confidence >= 70` (or lens `blocker`)
- **Important** — `severity >= 5` and `confidence >= 60` (or lens `warning`)
- **Minor** — `severity >= 3` and `confidence >= 50` (or lens `note`)

A finding lands in the highest tier whose thresholds it meets. Tag any finding that skipped verification (Step 4 gate) as `unverified`. Render lens-style lines per `references/severity.md`. Also include:

- **Dismissed** — each with its one-line reason (only when the verifier ran).
- **Lenses** — names applied, or `none`.
- **Verification** — `ran` or `skipped (low-risk diff)`.
- **Metadata** — files reviewed, findings from discovery, findings after verification (or `n/a` when skipped), final count.

If there are no confirmed findings, say so plainly — do not invent concerns.

## Step 6: Close the loop

If the user pushes back ("that's intentional" / "you missed X"), offer `/code-reviewer learn` so the correction becomes a durable invariant in the context and the next review won't repeat the mistake.
