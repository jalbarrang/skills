/**
 * Relative / ISO / "now" time resolution (ported from pi-extensions datadog client).
 */

/**
 * Parses a relative time string (e.g. "15m", "1h", "7d") into a Date.
 * Returns null if the string is not a recognized relative format.
 */
export function parseRelativeTime(input) {
  const match = String(input).match(/^(\d+)([mhd])$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const multipliers = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() - amount * multipliers[match[2]]);
}

/**
 * Resolves a time input to a Date.
 * Accepts: relative ("15m", "1h"), ISO 8601, or "now".
 * @returns {{ ok: true, date: Date } | { ok: false, error: string }}
 */
export function resolveTime(input) {
  if (input === 'now') return { ok: true, date: new Date() };

  const relative = parseRelativeTime(input);
  if (relative) return { ok: true, date: relative };

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return {
      ok: false,
      error: `Invalid time format: "${input}". Use relative (15m, 1h, 7d), ISO 8601, or "now".`,
    };
  }
  return { ok: true, date };
}
