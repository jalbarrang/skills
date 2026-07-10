import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AGENTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../agents',
);

/** Absolute path to this skill's agents/ directory. */
export function agentsDir() {
  return AGENTS_DIR;
}

/** Sorted list of agent names (stem of *.md). */
export function listAgents() {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  return fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -3))
    .sort();
}

/** Parse YAML-ish frontmatter; returns { meta, body }. */
export function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { meta: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, body: raw };
  const fm = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  const meta = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return { meta, body };
}

/**
 * Load agents/<name>.md. On missing agent, returns { error, available }.
 * @returns {{ name: string, description?: string, model?: string, thinking?: string, body: string } | { error: string, available: string[] }}
 */
export function loadAgent(name) {
  const available = listAgents();
  if (!name || !available.includes(name)) {
    return {
      error: `Unknown agent "${name || ''}". Available: ${available.join(', ') || '(none)'}`,
      available,
    };
  }
  const raw = fs.readFileSync(path.join(AGENTS_DIR, `${name}.md`), 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  return {
    name: meta.name || name,
    description: meta.description,
    model: meta.model,
    thinking: meta.thinking,
    body,
  };
}
