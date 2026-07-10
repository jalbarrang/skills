/**
 * Write full JSON payload to a temp file; return absolute path.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * @param {unknown} data
 * @param {string} [prefix]
 * @returns {string} absolute path
 */
export function writeTempJson(data, prefix = 'logs') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'datadog-'));
  const filePath = path.join(dir, `${prefix}-${Date.now()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return filePath;
}
