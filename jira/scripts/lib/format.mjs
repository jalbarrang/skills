/**
 * Jira digest / full formatters — ported from the pi jira extension format.ts.
 */

/** Flattens an ADF document, plain string, or null into readable text. */
export function adfToText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);

  const parts = [];

  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (typeof n.text === 'string') parts.push(n.text);
    if (n.type === 'hardBreak') parts.push('\n');
    if (Array.isArray(n.content)) {
      for (const child of n.content) walk(child);
      if (n.type === 'paragraph' || n.type === 'listItem' || n.type === 'heading') {
        parts.push('\n');
      }
    }
  };

  walk(value);
  return parts
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function name(ref, fallback = '—') {
  return ref?.displayName ?? ref?.name ?? fallback;
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/** Compact inline digest returned to the model (cheap on tokens). */
export function formatWorkItemDigest(issue, fullFile) {
  const f = issue.fields ?? {};
  const lines = [];
  lines.push(`${issue.key ?? '(no key)'} — ${f.summary ?? '(no summary)'}`);
  lines.push(
    `Type: ${name(f.issuetype)} | Status: ${name(f.status)} | Priority: ${name(f.priority)} | Assignee: ${name(f.assignee)}`,
  );
  if (f.labels?.length) lines.push(`Labels: ${f.labels.join(', ')}`);
  if (f.parent?.key) lines.push(`Parent: ${f.parent.key} — ${f.parent.fields?.summary ?? ''}`);

  const desc = adfToText(f.description);
  if (desc) lines.push('', truncate(desc, 600));

  const comments = f.comment?.comments ?? [];
  const total = f.comment?.total ?? comments.length;
  if (total > 0) lines.push('', `Comments: ${total} (full thread in file)`);

  if (fullFile) lines.push('', `Full ticket written to: ${fullFile}`);
  return lines.join('\n');
}

/** Full, untruncated markdown written to a temp file for the agent to read. */
export function formatWorkItemFull(issue) {
  const f = issue.fields ?? {};
  const lines = [];
  lines.push(`# ${issue.key ?? ''} — ${f.summary ?? ''}`, '');
  lines.push(`- Type: ${name(f.issuetype)}`);
  lines.push(`- Status: ${name(f.status)}`);
  lines.push(`- Priority: ${name(f.priority)}`);
  lines.push(`- Assignee: ${name(f.assignee)}`);
  lines.push(`- Reporter: ${name(f.reporter)}`);
  if (f.labels?.length) lines.push(`- Labels: ${f.labels.join(', ')}`);
  if (f.components?.length)
    lines.push(`- Components: ${f.components.map((c) => name(c)).join(', ')}`);
  if (f.parent?.key) lines.push(`- Parent: ${f.parent.key} — ${f.parent.fields?.summary ?? ''}`);
  if (f.created) lines.push(`- Created: ${f.created}`);
  if (f.updated) lines.push(`- Updated: ${f.updated}`);

  const desc = adfToText(f.description);
  lines.push('', '## Description', '', desc || '_(no description)_');

  const comments = f.comment?.comments ?? [];
  if (comments.length > 0) {
    lines.push('', `## Comments (${f.comment?.total ?? comments.length})`, '');
    lines.push(formatComments(comments));
  }

  return lines.join('\n');
}

export function formatComments(comments) {
  if (comments.length === 0) return '_(no comments)_';
  return comments
    .map((c) => {
      const who = name(c.author);
      const when = c.updated ?? c.created ?? '';
      const body = adfToText(c.body);
      return `### ${who}${when ? ` · ${when}` : ''}${c.id ? ` · #${c.id}` : ''}\n\n${body}`;
    })
    .join('\n\n');
}

/**
 * Compact comment digest for inline tool output: most recent few comments,
 * each body truncated. The full thread lives in the temp file.
 */
export function formatCommentsDigest(comments, key, fullFile, preview = 3) {
  if (comments.length === 0) return `${key}: no comments.`;
  const recent = comments.slice(-preview);
  const lines = [`${key}: ${comments.length} comment(s). Most recent ${recent.length}:`, ''];
  for (const c of recent) {
    const who = name(c.author);
    const when = c.updated ?? c.created ?? '';
    lines.push(`- ${who}${when ? ` · ${when}` : ''}: ${truncate(adfToText(c.body), 200)}`);
  }
  if (fullFile) lines.push('', `Full thread written to: ${fullFile}`);
  return lines.join('\n');
}

/** Full, untruncated comment thread written to a temp file. */
export function formatCommentsFull(comments, key) {
  return `# Comments — ${key} (${comments.length})\n\n${formatComments(comments)}`;
}

/** Pulls the issues array out of acli's search payload (shape varies). */
export function extractIssues(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    for (const key of ['issues', 'workItems', 'results', 'data']) {
      if (Array.isArray(payload[key])) return payload[key];
    }
  }
  return [];
}

export function formatSearchDigest(issues, fullFile) {
  if (issues.length === 0) return 'No matching work items.';
  const lines = issues.map((issue) => {
    const f = issue.fields ?? {};
    return `- ${issue.key ?? '?'} [${name(f.status, '?')}] ${truncate(f.summary ?? '', 100)}${
      f.assignee ? ` (@${name(f.assignee)})` : ''
    }`;
  });
  const out = [`${issues.length} work item(s):`, ...lines];
  if (fullFile) out.push('', `Full results (with descriptions) written to: ${fullFile}`);
  return out.join('\n');
}

/** Full search results written to a temp file — one rendered block per item. */
export function formatSearchFull(issues) {
  if (issues.length === 0) return 'No matching work items.';
  return `# Search results (${issues.length})\n\n${issues.map((issue) => formatWorkItemFull(issue)).join('\n\n---\n\n')}`;
}
