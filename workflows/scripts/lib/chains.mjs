/**
 * Saved-chain resolution. A chain is a validated workflow JSON stored as `<name>.chain.json`. Search order for a bare name: project `.agents/chains/`, project `.pi/chains/` (pi-plan-mode compatible), user `~/.agents/chains/`, user `~/.pi/agent/chains/`.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findAgentsDir } from './agents.mjs';

const NAME = /^[a-z][a-z0-9-]{0,62}$/;

export function chainSearchPaths(cwd) {
  const paths = [];
  const projectAgentsDir = findAgentsDir(cwd);
  if (projectAgentsDir) paths.push(path.join(projectAgentsDir, 'chains'));
  paths.push(path.join(cwd, '.pi', 'chains'));
  paths.push(path.join(os.homedir(), '.agents', 'chains'));
  paths.push(path.join(os.homedir(), '.pi', 'agent', 'chains'));
  return paths;
}

/**
 * Resolve a workflow argument to a JSON value. If `ref` is an existing file it is read directly; otherwise it is treated as a saved-chain name and looked up across the search paths. Throws with the searched locations when nothing matches.
 */
export function resolveWorkflowRef(cwd, ref) {
  if (fs.existsSync(ref) && fs.statSync(ref).isFile()) {
    return { path: path.resolve(ref), raw: fs.readFileSync(ref, 'utf8') };
  }
  if (!NAME.test(ref)) {
    throw new Error(`"${ref}" is neither an existing file nor a valid chain name (kebab-case, max 63 chars).`);
  }
  const searched = [];
  for (const dir of chainSearchPaths(cwd)) {
    const candidate = path.join(dir, `${ref}.chain.json`);
    searched.push(candidate);
    if (fs.existsSync(candidate)) {
      return { path: candidate, raw: fs.readFileSync(candidate, 'utf8') };
    }
  }
  throw new Error(`Saved chain "${ref}" not found. Searched:\n  ${searched.join('\n  ')}`);
}
