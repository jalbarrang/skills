import os from 'node:os';
import path from 'node:path';
import { loadConfig } from './config.mjs';
import { hoursToMs } from './hash.mjs';

export const DEFAULT_RESOLVE_TTL_HOURS = 168;
export const DEFAULT_DOCS_TTL_HOURS = 24;

function positiveNumber(value, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

/** Resolve API key + TTLs + cache home. Precedence: env > loadConfig('context7'). */
export function loadSettings() {
  const cfg = loadConfig('context7');
  const apiKey =
    process.env.CONTEXT7_API_KEY?.trim() ||
    (typeof cfg.apiKey === 'string' ? cfg.apiKey.trim() : '') ||
    undefined;

  const cacheCfg = cfg.cache && typeof cfg.cache === 'object' ? cfg.cache : {};
  const resolveTtlHours = positiveNumber(cacheCfg.resolveTtlHours, DEFAULT_RESOLVE_TTL_HOURS);
  const docsTtlHours = positiveNumber(cacheCfg.docsTtlHours, DEFAULT_DOCS_TTL_HOURS);

  const cacheDir = path.join(os.homedir(), '.agents', 'context7', 'cache');

  return {
    apiKey,
    cacheDir,
    cacheReadDirs: [cacheDir],
    resolveTtlMs: hoursToMs(resolveTtlHours),
    docsTtlMs: hoursToMs(docsTtlHours),
  };
}

export function requireApiKey(settings) {
  if (settings.apiKey) return;
  console.error(
    'Missing Context7 API key. Set CONTEXT7_API_KEY, or set apiKey in ~/.agents/context7.json.',
  );
  process.exit(1);
}
