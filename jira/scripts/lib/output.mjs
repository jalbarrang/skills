/**
 * Temp-file context writer — ported from the pi jira extension output.ts.
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Writes the full (untruncated) ticket context to a temp file the agent can
 * read with the `read` tool, keeping the inline response compact.
 *
 * @param {string} content
 * @param {string} [prefix]
 * @returns {Promise<string>} absolute path to the written file
 */
export async function writeContextFile(content, prefix = 'ticket') {
  const dir = await mkdtemp(join(tmpdir(), 'jira-'));
  const path = join(dir, `${prefix}-${Date.now()}.md`);
  await writeFile(path, content, 'utf-8');
  return path;
}
