/**
 * Log digest + normalization for stdout / temp-file payloads.
 */

const EXCERPT = 120;

export function normalizeLog(raw) {
  const attrs = raw?.attributes ?? {};
  return {
    id: raw?.id ?? 'unknown',
    timestamp: attrs.timestamp ?? 'unknown',
    status: attrs.status ?? 'unknown',
    service: attrs.service ?? 'unknown',
    host: attrs.host ?? 'unknown',
    message: attrs.message ?? '',
    tags: attrs.tags ?? [],
    attributes: attrs.attributes ?? {},
  };
}

function excerpt(text, max = EXCERPT) {
  const s = String(text).replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * Compact digest: header + one line per log (timestamp, service, status, message).
 */
export function formatLogsDigest(result, resultsFile) {
  const lines = [];
  lines.push(`Datadog logs — ${result.totalCount} result${result.totalCount === 1 ? '' : 's'}`);
  lines.push(`Query: ${result.query}`);
  lines.push(`Time:  ${result.from} → ${result.to}`);

  if (result.logs.length === 0) {
    lines.push('');
    lines.push('No logs found.');
    return lines.join('\n');
  }

  const status = {};
  const services = new Set();
  for (const log of result.logs) {
    const s = String(log.status).toLowerCase();
    status[s] = (status[s] ?? 0) + 1;
    if (log.service !== 'unknown') services.add(log.service);
  }
  const breakdown = Object.entries(status)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');
  if (breakdown) lines.push(`Status: ${breakdown}`);
  if (services.size) lines.push(`Services: ${[...services].join(', ')}`);
  lines.push('');

  for (const log of result.logs) {
    lines.push(`${log.timestamp}  ${log.service}  ${log.status}  ${excerpt(log.message)}`);
  }

  if (resultsFile) {
    lines.push('');
    lines.push(`Full JSON: ${resultsFile}`);
  }
  return lines.join('\n');
}
