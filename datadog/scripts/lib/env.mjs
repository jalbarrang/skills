/**
 * Credentials + .env walk-up loader (no dotenv dep).
 * Existing process.env wins; .env only fills unset keys.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './config.mjs';

const DEFAULTS = {
  site: 'datadoghq.com',
  defaultTimeRange: '1h',
};

/** Walk cwd → root; load first `.env` found. Returns path or null. */
export function loadDotEnv(startDir = process.cwd()) {
  let dir = path.resolve(startDir);
  const { root } = path.parse(dir);
  while (true) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) {
      applyDotEnv(candidate);
      return candidate;
    }
    if (dir === root) return null;
    dir = path.dirname(dir);
  }
}

function applyDotEnv(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const body = trimmed.startsWith('export ') ? trimmed.slice(7) : trimmed;
    const eq = body.indexOf('=');
    if (eq === -1) continue;
    const key = body.slice(0, eq).trim();
    if (!key) continue;
    let value = body.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function getCredentials() {
  const apiKey = process.env.DD_API_KEY;
  const appKey = process.env.DD_APP_KEY;
  if (!apiKey || !appKey) return null;
  return { apiKey, appKey };
}

/** Print actionable auth error and exit 1. Never throws. */
export function requireCredentials() {
  const creds = getCredentials();
  if (creds) return creds;
  const missing = [
    !process.env.DD_API_KEY && 'DD_API_KEY',
    !process.env.DD_APP_KEY && 'DD_APP_KEY',
  ].filter(Boolean);
  console.error(
    `Missing Datadog credentials: ${missing.join(', ')}.\n\nSet DD_API_KEY and DD_APP_KEY to enable Datadog search.`,
  );
  process.exit(1);
}

export function getDatadogConfig() {
  const cfg = loadConfig('datadog', DEFAULTS);
  return {
    site: typeof cfg.site === 'string' && cfg.site ? cfg.site : DEFAULTS.site,
    service: typeof cfg.service === 'string' ? cfg.service : undefined,
    env: typeof cfg.env === 'string' ? cfg.env : undefined,
    defaultTags: Array.isArray(cfg.defaultTags) ? cfg.defaultTags.filter((t) => typeof t === 'string') : undefined,
    defaultTimeRange:
      typeof cfg.defaultTimeRange === 'string' && cfg.defaultTimeRange
        ? cfg.defaultTimeRange
        : DEFAULTS.defaultTimeRange,
    rumApplicationId: typeof cfg.rumApplicationId === 'string' ? cfg.rumApplicationId : undefined,
    rumService: typeof cfg.rumService === 'string' ? cfg.rumService : undefined,
  };
}
