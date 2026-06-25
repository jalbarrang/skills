---
name: changelog-announce
description: Generate Slack-friendly changelog announcements from git diffs or described changes. Use when the user asks for a changelog, release notes, Slack announcement, or update summary for their team.
---

# Changelog Announce

Generate concise, non-technical changelog entries ready to copy-paste into Slack, Linear, Notion, or any team channel.

## Output Rules

1. **No header, no greeting, no sign-off.** Output ONLY the bullet-point content — the user wraps it in their own format.
2. **Audience is non-technical.** Describe what changed from the user's perspective, not the code's.
3. **Use emoji bullets** — ✅ for fixes/improvements, ⚠️ for caveats/known trade-offs, 🆕 for new features, 🗑️ for removals.
4. **One line per change.** Bold the headline, follow with a plain-English explanation. No code, no file paths, no function names.
5. **Group by impact, not by file.** Lead with what users care about most.
6. **Caveats go last** under ⚠️ — always include if behavior changed in a way that could surprise someone.
7. **Max 8 bullets.** If more changes exist, consolidate related ones into a single bullet.

## Process

1. Read the git diff (`git log --oneline main..HEAD`, then `git diff main --stat`) or ask the user to describe the changes.
2. Identify user-facing impact for each change.
3. Drop internal-only changes (refactors, test updates, config) unless they affect workflow.
4. Write the bullets following the output rules above.

## Example Output

```
✅ **Projects no longer appear out of nowhere** — Previously, an empty "Untitled" project would show up every time you opened the app. Now you'll only see projects you actually created.

✅ **Your style choices stick** — Picking a visual style and refreshing the page no longer loses your selection.

🆕 **Cross-device memory** — Your last-active project is now remembered across sessions, even on different devices.

⚠️ **New ideas don't survive hard refresh** — If you're drafting a new idea and do a hard refresh before committing, you'll need to re-enter it. Once you commit, everything saves normally.
```
