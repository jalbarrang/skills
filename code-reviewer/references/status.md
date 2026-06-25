# status — report review-context health

A quick read-only check of `.code-reviewer/context.md`. No review is run.

## Steps

1. Check whether `.code-reviewer/context.md` exists.
   - **Missing** → report that reviews will run in `generalized` mode and
     recommend `/code-reviewer init`. Stop.
2. Read the file and report, tersely:
   - **Sections filled vs placeholder** — flag any section still holding template
     `<placeholders>` or that is empty; those are unfinished.
   - **Coverage** — note whether the high-value sections exist: Critical
     invariants and Intentional patterns. If either is absent, reviews lose most
     of their project signal — recommend `init` or `learn` to fill them.
   - **Staleness signal** — compare the file's last-modified time against recent
     repo activity (`git log -1 --format=%cr` on the file vs the tree). If the
     codebase has moved substantially since the context was written, suggest a
     refresh pass.
3. Recommend the next command:
   - Unfinished/placeholder sections → `/code-reviewer init` (refresh/merge).
   - Healthy but a recent review got a call wrong → `/code-reviewer learn`.
   - Healthy and current → `/code-reviewer review`.

Keep the report to a few lines. This is a glance, not an audit.
