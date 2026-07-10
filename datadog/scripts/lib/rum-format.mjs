/**
 * RUM digest + normalization for stdout / temp-file payloads.
 */

export function normalizeRum(raw) {
  const attrs = raw?.attributes ?? {};
  const nested = attrs.attributes ?? {};
  const eventType = typeof nested.type === 'string' ? nested.type : 'unknown';
  return {
    id: raw?.id ?? 'unknown',
    eventType,
    timestamp: attrs.timestamp ?? 'unknown',
    service: attrs.service ?? 'unknown',
    tags: attrs.tags ?? [],
    attributes: nested,
  };
}

function nested(attrs, group, key) {
  const obj = attrs?.[group];
  if (obj && typeof obj === 'object' && key in obj && obj[key] != null) {
    return String(obj[key]);
  }
  return undefined;
}

/**
 * Compact digest: header + one line per event (timestamp, type, service, view/session).
 */
export function formatRumDigest(result, resultsFile) {
  const lines = [];
  lines.push(`Datadog RUM — ${result.totalCount} event${result.totalCount === 1 ? '' : 's'}`);
  lines.push(`Query: ${result.query}`);
  lines.push(`Time:  ${result.from} → ${result.to}`);

  if (result.events.length === 0) {
    lines.push('');
    lines.push('No RUM events found.');
    return lines.join('\n');
  }

  const types = {};
  const services = new Set();
  for (const ev of result.events) {
    const t = String(ev.eventType).toLowerCase();
    types[t] = (types[t] ?? 0) + 1;
    if (ev.service !== 'unknown') services.add(ev.service);
  }
  const breakdown = Object.entries(types)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');
  if (breakdown) lines.push(`Types: ${breakdown}`);
  if (services.size) lines.push(`Services: ${[...services].join(', ')}`);
  lines.push('');

  for (const ev of result.events) {
    const view =
      nested(ev.attributes, 'view', 'url_path') ??
      nested(ev.attributes, 'view', 'url') ??
      nested(ev.attributes, 'session', 'id') ??
      '';
    lines.push(`${ev.timestamp}  ${ev.eventType}  ${ev.service}  ${view}`);
  }

  if (resultsFile) {
    lines.push('');
    lines.push(`Full JSON: ${resultsFile}`);
  }
  return lines.join('\n');
}
