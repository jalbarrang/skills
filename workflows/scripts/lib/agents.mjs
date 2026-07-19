/**
 * Agent definition discovery. Agents are markdown files with flat YAML frontmatter (name, description, model, thinking, runner) whose body is the agent's system prompt.
 *
 * Search order (first definition of a name wins): project `.agents/subagents/*.md` (nearest `.agents` directory walking up from cwd), then `~/.agents/subagents/*.md`.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Walk from `startDir` to filesystem root; return the first existing `<dir>/.agents` directory, or null. */
export function findAgentsDir(startDir) {
  let dir = path.resolve(startDir);
  const { root } = path.parse(dir);
  while (true) {
    const candidate = path.join(dir, '.agents');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) return candidate;
    if (dir === root) return null;
    dir = path.dirname(dir);
  }
}

/** Parse flat `key: value` YAML frontmatter delimited by `---` lines. Returns { data, body }. */
export function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!entry) continue;
    let value = entry[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value) data[entry[1]] = value;
  }
  return { data, body: match[2].trim() };
}

function readAgentsFrom(dir, source, agents) {
  if (!fs.existsSync(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (err) {
    console.error(`agents: could not read ${dir}: ${err.message}`);
    return;
  }
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.md')) continue;
    const file = path.join(dir, entry);
    let raw;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch (err) {
      console.error(`agents: could not read ${file}: ${err.message}`);
      continue;
    }
    const { data, body } = parseFrontmatter(raw);
    const name = data.name ?? entry.replace(/\.md$/, '');
    if (agents.has(name)) continue; // earlier scope wins
    agents.set(name, {
      name,
      description: data.description,
      model: data.model,
      thinking: data.thinking,
      runner: data.runner,
      systemPrompt: body,
      source,
      file,
    });
  }
}

/**
 * Discover agents visible from `cwd`. `scope` mirrors the workflow spec's agentScope: 'project', 'user', or 'both' (default).
 */
export function discoverAgents(cwd, scope = 'both') {
  const agents = new Map();
  if (scope === 'project' || scope === 'both') {
    const projectAgentsDir = findAgentsDir(cwd);
    if (projectAgentsDir) readAgentsFrom(path.join(projectAgentsDir, 'subagents'), 'project', agents);
  }
  if (scope === 'user' || scope === 'both') {
    readAgentsFrom(path.join(os.homedir(), '.agents', 'subagents'), 'user', agents);
  }
  return agents;
}

/** Look up one agent or throw with the list of available names. */
export function requireAgent(agents, name) {
  const agent = agents.get(name);
  if (!agent) {
    const available = [...agents.keys()].join(', ') || 'none';
    throw new Error(`Unknown agent: "${name}". Available: ${available}. Define it as a markdown file in .agents/subagents/ (project) or ~/.agents/subagents/ (user).`);
  }
  return agent;
}
