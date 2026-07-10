/** Frame agent output with a stable heading for handoff. */
export function formatResult(agentName, model, body) {
  const text = (body ?? '').replace(/\s+$/, '');
  return `## ${agentName} · ${model}\n\n${text}\n`;
}

/** Final parallel summary line. */
export function formatSummary(succeeded, failed) {
  return `${succeeded} succeeded / ${failed} failed`;
}
