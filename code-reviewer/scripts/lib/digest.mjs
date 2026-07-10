/** Build a short stat digest from a collected diff result. */
export function buildDigest(result) {
  const files = result.files?.length ?? 0;
  let insertions = 0;
  let deletions = 0;
  for (const line of (result.diff || '').split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) insertions++;
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
  }
  // Prefer --stat summary numbers when present (e.g. "3 files changed, 10 insertions(+), 2 deletions(-)")
  const summary = (result.stat || '').split('\n').find((l) => /files? changed/.test(l));
  if (summary) {
    const ins = summary.match(/(\d+)\s+insertions?\(\+\)/);
    const del = summary.match(/(\d+)\s+deletions?\(-\)/);
    if (ins) insertions = Number(ins[1]);
    if (del) deletions = Number(del[1]);
  }
  return {
    label: result.label || 'changes',
    files,
    insertions,
    deletions,
    line: `${result.label || 'changes'}: ${files} file(s), +${insertions}/-${deletions}`,
  };
}

/** Serialize full payload for the temp file the agent will read. */
export function formatPayload(result) {
  const fileList = (result.files || []).join('\n') || '(none)';
  return [
    `# Diff target: ${result.label}`,
    '',
    '## Changed files',
    fileList,
    '',
    '## Stat',
    (result.stat || '').trim() || '(empty)',
    '',
    '## Diff',
    result.diff || '(empty diff)',
    '',
  ].join('\n');
}
