/**
 * Canonical config resolver template. Copy verbatim into each skill as scripts/lib/config.mjs — never import across skills.
 *
 * Precedence (highest wins): project .agents/<skill>.json > ~/.agents/<skill>.json > caller defaults.
 * String values that start with `$` are interpolated from process.env (empty string if unset).
 * Malformed JSON is skipped with a one-line stderr warning.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Walk from `startDir` up to filesystem root; return the first existing
 * `<dirName>/<fileName>`, or null.
 */
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

/**
 * Read and parse a JSON config file. On malformed JSON, warn to stderr and
 * return null. Missing files return null silently.
 */
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

/**
 * Replace any string value that starts with `$` with process.env[name].
 * Unset vars become empty string. Recurses into plain objects; leaves arrays as-is (shallow values only for array elements).
 */
function interpolateEnv(value) {
  if (typeof value === 'string') {
    if (value.startsWith('$') && value.length > 1) {
      const name = value.slice(1);
      return process.env[name] ?? '';
    }
    return value;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = interpolateEnv(v);
    }
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateEnv(item));
  }
  return value;
}

/**
 * Load merged config for `skillName`.
 * @param {string} skillName
 * @param {Record<string, unknown>} [defaults] optional env-var / built-in defaults (lowest precedence)
 * @returns {Record<string, unknown>}
 */
export function loadConfig(skillName, defaults = {}) {
  if (!skillName || typeof skillName !== 'string') {
    console.error('config: skillName is required');
    return { ...defaults };
  }

  const fileName = `${skillName}.json`;
  const cwd = process.cwd();

  const projectPath = findUp(cwd, '.agents', fileName);
  const globalPath = path.join(os.homedir(), '.agents', fileName);
  // Merge lowest → highest: defaults < global < project
  const layers = [defaults, readJsonFile(globalPath), readJsonFile(projectPath)];

  const merged = {};
  for (const layer of layers) {
    if (!layer || typeof layer !== 'object' || Array.isArray(layer)) continue;
    Object.assign(merged, layer);
  }

  return interpolateEnv(merged);
}
