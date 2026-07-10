import fs from 'node:fs';
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

function readLegacyPiConfig() {
  const configPath = path.join(
    os.homedir(),
    '.pi',
    'agent',
    'extensions',
    'context7',
    'config.json',
  );
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) ?? {};
  } catch {
    return {};
  }
}

/** Resolve API key + TTLs + cache homes. Precedence: env > loadConfig > legacy pi config. */
export function loadSettings() {
  const cfg = loadConfig('context7');
  const legacy = readLegacyPiConfig();
  const apiKey =
    process.env.CONTEXT7_API_KEY?.trim() ||
    (typeof cfg.apiKey === 'string' ? cfg.apiKey.trim() : '') ||
    (typeof legacy.apiKey === 'string' ? legacy.apiKey.trim() : '') ||
    undefined;

  const cacheCfg = cfg.cache && typeof cfg.cache === 'object' ? cfg.cache : {};
  const legacyCache = legacy.cache && typeof legacy.cache === 'object' ? legacy.cache : {};
  const resolveTtlHours = positiveNumber(
    cacheCfg.resolveTtlHours ?? legacyCache.resolveTtlHours,
    DEFAULT_RESOLVE_TTL_HOURS,
  );
  const docsTtlHours = positiveNumber(
    cacheCfg.docsTtlHours ?? legacyCache.docsTtlHours,
    DEFAULT_DOCS_TTL_HOURS,
  );

  const primaryCacheDir = path.join(os.homedir(), '.agents', 'context7', 'cache');
  const legacyCacheDir = path.join(
    os.homedir(),
    '.pi',
    'agent',
    'extensions',
    'context7',
    'cache',
  );

  return {
    apiKey,
    cacheDir: primaryCacheDir,
    cacheReadDirs: [primaryCacheDir, legacyCacheDir],
    resolveTtlMs: hoursToMs(resolveTtlHours),
    docsTtlMs: hoursToMs(docsTtlHours),
  };
}

export function requireApiKey(settings) {
  if (settings.apiKey) return;
  console.error(
    'Missing Context7 API key. Set CONTEXT7_API_KEY, or set apiKey in ~/.agents/context7.json, or in ~/.pi/agent/extensions/context7/config.json.',
  );
  process.exit(1);
}
