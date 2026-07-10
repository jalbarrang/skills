/**
 * Canonical config resolver (copied from _shared/config.mjs; compressed to stay under 100 lines).
 * Precedence (highest wins): project .agents/<skill>.json > ~/.agents/<skill>.json > .pi/<skill>.json > defaults.
 * Strings starting with `$` interpolate from process.env. Malformed JSON is skipped with a stderr warning.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function findUp(startDir, dirName, fileName) {
  let dir = path.resolve(startDir);
  const { root } = path.parse(dir);
  while (true) {
    const candidate = path.join(dir, dirName, fileName);
    if (fs.existsSync(candidate)) return candidate;
    if (dir === root) return null;
    dir = path.dirname(dir);
  }
}

function readJsonFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`config: could not read ${filePath}: ${err.message}`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    console.error(`config: malformed JSON in ${filePath}, skipping`);
    return null;
  }
}

function interpolateEnv(value) {
  if (typeof value === 'string') {
    if (value.startsWith('$') && value.length > 1) return process.env[value.slice(1)] ?? '';
    return value;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = interpolateEnv(v);
    return out;
  }
  if (Array.isArray(value)) return value.map((item) => interpolateEnv(item));
  return value;
}

/** @param {string} skillName @param {Record<string, unknown>} [defaults] */
export function loadConfig(skillName, defaults = {}) {
  if (!skillName || typeof skillName !== 'string') {
    console.error('config: skillName is required');
    return { ...defaults };
  }
  const fileName = `${skillName}.json`;
  const cwd = process.cwd();
  const layers = [
    defaults,
    readJsonFile(findUp(cwd, '.pi', fileName)),
    readJsonFile(path.join(os.homedir(), '.agents', fileName)),
    readJsonFile(findUp(cwd, '.agents', fileName)),
  ];
  const merged = {};
  for (const layer of layers) {
    if (!layer || typeof layer !== 'object' || Array.isArray(layer)) continue;
    Object.assign(merged, layer);
  }
  return interpolateEnv(merged);
}
