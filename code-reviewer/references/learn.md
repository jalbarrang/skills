# learn — fold a miss into the context (anti-rot loop)

This is the **update-on-every-miss** rule made into a command. A review just got
something wrong; capture the durable lesson in `.code-reviewer/context.md` so it
never recurs. Two cases:

- **False positive** — the reviewer flagged something that is intentional.
  → record it under **Intentional patterns** so the verifier suppresses it.
- **Miss** — the reviewer failed to catch a real bug.
  → record the rule that should have caught it under **Critical invariants** or
  **Historical bug classes**, naming the file that owns it.

## Step 1: Identify the lesson

From the user's note (and the prior review if it's in context), determine: which
case is this, what's the durable rule, and which file/module owns it. If unclear,
ask one question — do not guess.

## Step 2: Distill to an invariant

Write the rule the anti-rot way:

- **Invariant, not incident** — "config values from env are validated in
  `config.ts`; missing keys throw at boot, so downstream null-checks are
  redundant" — not "I flagged a null check that was fine".
- **Name the owner** — the file/module that enforces or embodies the rule.
- **One line, scannable** — bold lead, then the mechanism.

## Step 3: Place it (and dedupe)

Find the right section in `.code-reviewer/context.md`. Before adding, check
whether a near-duplicate line already exists:

- If yes, sharpen the existing line instead of appending a second.
- If no, add the single new line in the correct section.

Never let the file accumulate two lines that say the same thing — one owner per
fact.

## Step 4: Confirm and write

Show the user the exact one-line addition/edit and the section it lands in. On
confirmation, write it. Keep the rest of the file untouched.

If `.code-reviewer/context.md` doesn't exist yet, tell the user to run
`/code-reviewer init` first — `learn` maintains a context, it doesn't bootstrap
one.
