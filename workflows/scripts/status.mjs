#!/usr/bin/env node
/**
 * Inspect and control workflow runs.
 *
 * Usage:
 *   node status.mjs                 # table of all runs, newest first
 *   node status.mjs <run-id>        # one run: phases, outputs, error
 *   node status.mjs --stop <run-id> # terminate a running workflow (SIGTERM to its process group)
 *   node status.mjs --json [id]     # machine-readable
 */
import path from 'node:path';
import { loadConfig } from './lib/config.mjs';
import { listRuns, pidAlive, readState, runDir, stateRoot, writeState } from './lib/state.mjs';

function effectiveStatus(state) {
  if (state.status === 'running' && !pidAlive(state.pid)) return 'stale';
  return state.status;
}

function phaseCounts(state) {
  const done = state.phases.filter((phase) => phase.status === 'completed').length;
  return `${done}/${state.phases.length}`;
}

function printTable(runs) {
  if (runs.length === 0) {
    console.log('No workflow runs found.');
    return;
  }
  const rows = runs.map((state) => [state.id, state.name ?? '', effectiveStatus(state), phaseCounts(state), state.startedAt ?? '', String(state.pid ?? '')]);
  const headers = ['ID', 'NAME', 'STATUS', 'PHASES', 'STARTED', 'PID'];
  const widths = headers.map((header, column) => Math.max(header.length, ...rows.map((row) => row[column].length)));
  const line = (row) => row.map((cell, column) => cell.padEnd(widths[column])).join('  ');
  console.log(line(headers));
  for (const row of rows) console.log(line(row));
}

function printDetail(state, dir) {
  console.log(`Run:     ${state.id}`);
  console.log(`Name:    ${state.name}`);
  console.log(`Status:  ${effectiveStatus(state)}${state.pid ? ` (pid ${state.pid})` : ''}`);
  console.log(`Started: ${state.startedAt}${state.finishedAt ? `\nFinished: ${state.finishedAt}` : ''}`);
  console.log(`State:   ${path.join(dir, 'state.json')}`);
  console.log('\nPhases:');
  state.phases.forEach((phase, index) => {
    const output = phase.outputFile ? ` → ${path.join(dir, phase.outputFile)}` : '';
    console.log(`  ${index + 1}. [${phase.status}] ${phase.label}${output}`);
  });
  if (state.error) console.log(`\nError: ${state.error}`);
  if (effectiveStatus(state) === 'stale') {
    console.log('\nThis run says "running" but its process is gone. Resume it: node run.mjs --resume ' + state.id);
  }
}

function stopRun(root, id) {
  const dir = runDir(root, id);
  const state = readState(dir);
  if (!state) {
    console.error(`No run state found for ${id} under ${root}.`);
    process.exit(1);
  }
  if (state.status !== 'running') {
    console.error(`Run ${id} is not running (status: ${state.status}).`);
    process.exit(1);
  }
  if (!pidAlive(state.pid)) {
    state.status = 'stopped';
    state.error = state.error ?? 'Marked stopped by status.mjs: recorded process was already gone.';
    state.finishedAt = new Date().toISOString();
    writeState(dir, state);
    console.log(`Run ${id} process was already gone; state marked stopped.`);
    return;
  }
  try {
    process.kill(-state.pid, 'SIGTERM'); // background runs lead their own process group
  } catch {
    try {
      process.kill(state.pid, 'SIGTERM');
    } catch (err) {
      console.error(`Could not signal pid ${state.pid}: ${err.message}`);
      process.exit(1);
    }
  }
  console.log(`Stop signal sent to run ${id} (pid ${state.pid}). It will mark itself stopped; check again shortly.`);
}

function main() {
  const argv = process.argv.slice(2);
  const config = loadConfig('workflows');
  const root = stateRoot(process.cwd(), config);

  const json = argv.includes('--json');
  const rest = argv.filter((token) => token !== '--json');

  if (rest[0] === '--stop') {
    if (!rest[1]) {
      console.error('Usage: node status.mjs --stop <run-id>');
      process.exit(1);
    }
    stopRun(root, rest[1]);
    return;
  }
  if (rest[0] === '--help' || rest[0] === '-h') {
    console.log('Usage: node status.mjs [run-id] [--stop <run-id>] [--json]');
    return;
  }

  if (rest[0]) {
    const dir = runDir(root, rest[0]);
    const state = readState(dir);
    if (!state) {
      console.error(`No run state found for ${rest[0]} under ${root}.`);
      process.exit(1);
    }
    if (json) console.log(JSON.stringify({ ...state, effectiveStatus: effectiveStatus(state) }, null, 2));
    else printDetail(state, dir);
    return;
  }

  const runs = listRuns(root);
  if (json) console.log(JSON.stringify(runs.map((state) => ({ ...state, effectiveStatus: effectiveStatus(state) })), null, 2));
  else printTable(runs);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
