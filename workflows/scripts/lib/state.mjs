/**
 * Durable run state. Each run owns `.agents/workflow-runs/<id>/` containing `state.json` (atomic writes: temp file + rename), per-phase output files, and — for background runs — `runner.log`. State survives the process, so `status.mjs` can inspect runs and `run.mjs --resume` can skip completed phases by reusing persisted outputs.
 */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { findAgentsDir } from './agents.mjs';

/** Resolve the run-state root: config `stateDir` override, else `<nearest .agents dir>/workflow-runs`, else `<cwd>/.agents/workflow-runs`. */
export function stateRoot(cwd, config = {}) {
  if (typeof config.stateDir === 'string' && config.stateDir.trim()) {
    return path.resolve(cwd, config.stateDir.trim());
  }
  const agentsDir = findAgentsDir(cwd) ?? path.join(cwd, '.agents');
  return path.join(agentsDir, 'workflow-runs');
}

export function newRunId() {
  return `wf_${randomUUID()}`;
}

export function runDir(root, id) {
  if (!/^wf_[0-9a-f-]{36}$/.test(id)) throw new Error(`"${id}" is not a valid run id (expected wf_<uuid>).`);
  return path.join(root, id);
}

/** Write state.json atomically (temp file + rename). */
export function writeState(dir, state) {
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, 'state.json');
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporary, target);
}

export function readState(dir) {
  const target = path.join(dir, 'state.json');
  if (!fs.existsSync(target)) return null;
  try {
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (err) {
    console.error(`workflows: unreadable state at ${target}: ${err.message}`);
    return null;
  }
}

/** List all runs under the root, newest first. */
export function listRuns(root) {
  if (!fs.existsSync(root)) return [];
  const runs = [];
  for (const entry of fs.readdirSync(root)) {
    if (!entry.startsWith('wf_')) continue;
    const state = readState(path.join(root, entry));
    if (state) runs.push(state);
  }
  return runs.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
}

/** True when the recorded pid is still alive. */
export function pidAlive(pid) {
  if (typeof pid !== 'number' || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Write a phase's raw output to its own file and return the file name. */
export function writePhaseOutput(dir, index, output) {
  const name = `phase-${String(index + 1).padStart(2, '0')}.out.txt`;
  fs.writeFileSync(path.join(dir, name), typeof output === 'string' ? output : `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  return name;
}
