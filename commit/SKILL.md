---
name: commit
description: Provide Conventional Commit message guidance. Use when the user asks to compose, validate, or improve a commit message; it defines message format only and does not prescribe git or repository behavior.
---

# commit

Apply the Conventional Commits format to the message. This skill governs message syntax and wording only; repository inspection, staging, committing, pushing, and other agent actions remain outside its scope.

## Message format

```text
type(optional-scope): imperative summary
```

- Keep the subject line at 72 characters or fewer.
- Prefer `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`.
- Use a concise, imperative summary with no trailing period.
- Include a body only when it clarifies why the change matters; hard-wrap body lines at 72 characters.

## Output

Return the proposed message in a fenced `text` block. If the user gives insufficient context, ask one focused question about the change.

## Delegated generation

Commit-message generation is a quick, bounded task. When delegating it, use `gpt-5.6-luna` with high reasoning. This routing applies only to generating or reviewing the message.
