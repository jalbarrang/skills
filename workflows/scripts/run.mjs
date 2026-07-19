#!/usr/bin/env node
/**
 * Execute a bounded workflow: sequential agent steps, static parallel groups, and bounded fan-out, with per-harness runner commands.
 *
 * Usage:
 *   node run.mjs <workflow.json | chain-name> [--runner <name>] [--dry-run] [--background]
 *   node run.mjs --resume <run-id> [--background]
 *
 * Foreground runs stream phase progress and exit 0 (completed), 1 (failed), or 130 (stopped). `--background` detaches the run and prints the run id; inspect with status.mjs. `--resume` relaunches a stopped or failed run, skipping phases that already completed by reusing their persisted outputs.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAgents, requireAgent } from './lib/agents.mjs';
import { resolveWorkflowRef } from './lib/chains.mjs';
import { loadConfig } from './lib/config.mjs';
import { commandOnPath, resolveRunners, requireRunner, composeCommand } from './lib/runners.mjs';
import { validateWorkflowSpec, workflowSummary, phaseLabel } from './lib/spec.mjs';
import { newRunId, pidAlive, readState, runDir, stateRoot, writePhaseOutput, writeState } from './lib/state.mjs';
import { coerceJson, mapWithConcurrency, pathValue, template } from './lib/template.mjs';

const SELF = fileURLToPath(import.meta.url);

function parseArgs(argv) {
  const args = { ref: undefined, runner: undefined, resume: undefined, runId: undefined, background: false, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--background' || token === '-b') args.background = true;
    else if (token === '--dry-run') args.dryRun = true;
    else if (token === '--help' || token === '-h') args.help = true;
    else if (token === '--runner') args.runner = argv[++i];
    else if (token === '--resume') args.resume = argv[++i];
    else if (token === '--run-id') args.runId = argv[++i];
    else if (token.startsWith('-')) throw new Error(`Unknown flag: ${token}`);
    else if (args.ref === undefined) args.ref = token;
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function usage() {
  return [
    'Usage:',
    '  node run.mjs <workflow.json | chain-name> [--runner <name>] [--dry-run] [--background]',
    '  node run.mjs --resume <run-id> [--background]',
  ].join('\n');
}

function pendingPhases(spec) {
  return spec.chain.map((step, index) => ({ label: phaseLabel(step, index), status: 'pending' }));
}

function loadWorkflowOrExit(cwd, ref) {
  let resolved;
  try {
    resolved = resolveWorkflowRef(cwd, ref);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  let parsed;
  try {
    parsed = JSON.parse(resolved.raw);
  } catch (err) {
    console.error(`${resolved.path} is not valid JSON: ${err.message}`);
    process.exit(1);
  }
  const validation = validateWorkflowSpec(parsed);
  if (!validation.valid) {
    console.error(`Invalid workflow (${resolved.path}):`);
    for (const error of validation.errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  return { spec: validation.normalized, maximumAgentCount: validation.maximumAgentCount, source: resolved.path };
}

function buildStepContext(cwd, config, spec, runnerOverride) {
  return {
    cwd,
    config,
    agents: discoverAgents(cwd, spec.agentScope ?? 'both'),
    runners: resolveRunners(config),
    runnerOverride,
    timeoutMs: typeof config.timeoutMinutes === 'number' && config.timeoutMinutes > 0 ? config.timeoutMinutes * 60_000 : undefined,
  };
}

function composeStepCommand(ctx, step, taskText) {
  const agent = requireAgent(ctx.agents, step.agent);
  const runnerName = ctx.runnerOverride ?? agent.runner ?? ctx.config.defaultRunner ?? 'pi';
  const templateArgv = requireRunner(ctx.runners, runnerName);
  const argv = composeCommand(templateArgv, {
    prompt: taskText,
    system: agent.systemPrompt,
    model: step.model ?? agent.model,
    thinking: step.thinking ?? agent.thinking,
    agent: agent.name,
  });
  return { argv, runnerName, agent };
}

/** Every agent step in the chain, including parallel children and fan-out templates. */
function agentSteps(chain) {
  const steps = [];
  for (const step of chain) {
    if ('expand' in step) steps.push(step.parallel);
    else if (Array.isArray(step.parallel)) steps.push(...step.parallel);
    else steps.push(step);
  }
  return steps;
}

/**
 * Fail fast before spawning anything: every agent must resolve and every selected runner's CLI must exist on PATH. Only runners a step actually selects are checked — pi is the sole default dependency; codex/cursor/claude CLIs are needed only when chosen.
 */
function preflight(ctx, spec) {
  const problems = new Set();
  for (const step of agentSteps(spec.chain)) {
    try {
      const { argv, runnerName } = composeStepCommand(ctx, step, 'preflight');
      if (!commandOnPath(argv[0])) {
        problems.add(`Runner "${runnerName}" needs "${argv[0]}" on PATH (agent "${step.agent}"). Install it, or route the step through an installed runner (e.g. --runner pi).`);
      }
    } catch (err) {
      problems.add(err.message);
    }
  }
  return [...problems];
}

function runAgentStep(ctx, step, taskText, signal) {
  const { argv } = composeStepCommand(ctx, step, taskText);
  return new Promise((resolve, reject) => {
    const child = spawn(argv[0], argv.slice(1), {
      cwd: ctx.cwd,
      signal,
      timeout: ctx.timeoutMs,
      killSignal: 'SIGTERM',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', (err) => {
      if (err.name === 'AbortError') return reject(new Error('stopped'));
      if (err.code === 'ENOENT') {
        return reject(new Error(`Runner command "${argv[0]}" is not installed (agent "${step.agent}"). Only the default runner (pi) is required; install ${argv[0]} or select another runner with --runner.`));
      }
      reject(err);
    });
    child.on('close', (code, sig) => {
      if (signal?.aborted) return reject(new Error('stopped'));
      if (sig) return reject(new Error(`Agent "${step.agent}" was killed (${sig})${ctx.timeoutMs ? ' — possibly by the configured timeout' : ''}.`));
      if (code !== 0) {
        const tail = stderr.trim().split('\n').slice(-8).join('\n');
        return reject(new Error(`Agent "${step.agent}" exited ${code}.${tail ? `\n${tail}` : ''}`));
      }
      resolve(stdout.trim());
    });
  });
}

function truncate(text, max = 100) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function dryRun(cwd, config, spec, runnerOverride, maximumAgentCount) {
  const ctx = buildStepContext(cwd, config, spec, runnerOverride);
  const fakeOutputs = new Proxy({}, { get: (_target, key) => `<outputs.${String(key)}>` });
  console.log(workflowSummary(spec, maximumAgentCount));
  console.log('\nResolved commands (dry run — nothing spawned):');
  let failed = false;
  spec.chain.forEach((step, index) => {
    const describe = (child, prefix) => {
      try {
        const taskText = template(child.task, spec.task, '<previous>', fakeOutputs, undefined);
        const { argv, runnerName } = composeStepCommand(ctx, child, taskText);
        const missing = commandOnPath(argv[0]) ? '' : ` (⚠ "${argv[0]}" not found on PATH)`;
        console.log(`  ${prefix}[${runnerName}] ${argv.map((token) => truncate(token)).join(' ')}${missing}`);
      } catch (err) {
        failed = true;
        console.error(`  ${prefix}ERROR: ${err.message}`);
      }
    };
    console.log(`${index + 1}. ${phaseLabel(step, index)}`);
    if ('expand' in step) describe(step.parallel, `up to ${step.expand.maxItems} × `);
    else if (Array.isArray(step.parallel)) step.parallel.forEach((child) => describe(child, ''));
    else describe(step, '');
  });
  process.exit(failed ? 1 : 0);
}

async function executeRun(state, dir, ctx, controller) {
  const outputs = Object.assign(Object.create(null), state.outputs ?? {});
  let previous = state.previous ?? '';
  const spec = state.workflow;
  const save = () => {
    state.outputs = { ...outputs };
    state.previous = previous;
    writeState(dir, state);
  };

  try {
    for (let index = 0; index < spec.chain.length; index++) {
      const step = spec.chain[index];
      const phase = state.phases[index];
      if (phase.status === 'completed') continue; // resume: reuse persisted output
      phase.status = 'running';
      save();
      console.log(`[${index + 1}/${spec.chain.length}] ${phase.label} — running`);

      if ('expand' in step) {
        const source = coerceJson(outputs[step.expand.from]);
        const items = pathValue(source, step.expand.path);
        if (!Array.isArray(items)) {
          throw new Error(`Fan-out source "${step.expand.from}${step.expand.path}" is not an array.`);
        }
        if (items.length > step.expand.maxItems) {
          throw new Error(`Fan-out exceeded maxItems (${items.length}/${step.expand.maxItems}).`);
        }
        const output = await mapWithConcurrency(items, step.concurrency ?? 4, async (item) =>
          runAgentStep(ctx, step.parallel, template(step.parallel.task, spec.task, previous, outputs, item), controller.signal),
        );
        outputs[step.collect.as] = output;
        previous = JSON.stringify(output);
      } else if (Array.isArray(step.parallel)) {
        const output = await mapWithConcurrency(step.parallel, step.concurrency ?? 4, async (child) =>
          runAgentStep(ctx, child, template(child.task, spec.task, previous, outputs), controller.signal),
        );
        previous = JSON.stringify(output);
        for (let childIndex = 0; childIndex < step.parallel.length; childIndex++) {
          const child = step.parallel[childIndex];
          if (child.as) outputs[child.as] = output[childIndex];
        }
      } else {
        previous = await runAgentStep(ctx, step, template(step.task, spec.task, previous, outputs), controller.signal);
        if (step.as) outputs[step.as] = previous;
      }

      phase.outputFile = writePhaseOutput(dir, index, previous);
      phase.status = 'completed';
      save();
      console.log(`[${index + 1}/${spec.chain.length}] ${phase.label} — completed`);
    }
    state.status = 'completed';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    state.error = message;
    const active = state.phases.find((phase) => phase.status === 'running');
    if (active) active.status = 'failed';
    state.status = controller.signal.aborted ? 'stopped' : 'failed';
  } finally {
    state.finishedAt = new Date().toISOString();
    save();
  }
}

function preflightOrExit(cwd, config, spec, runnerOverride) {
  const problems = preflight(buildStepContext(cwd, config, spec, runnerOverride), spec);
  if (problems.length > 0) {
    console.error('Workflow cannot start:');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
}

function spawnBackground(dir, childArgs) {
  const logFd = fs.openSync(path.join(dir, 'runner.log'), 'a');
  const child = spawn(process.execPath, [SELF, ...childArgs], {
    detached: true,
    stdio: ['ignore', logFd, logFd],
    cwd: process.cwd(),
  });
  child.unref();
  fs.closeSync(logFd);
  return child.pid;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`${err.message}\n${usage()}`);
    process.exit(1);
  }
  if (args.help || (!args.ref && !args.resume)) {
    console.log(usage());
    process.exit(args.help ? 0 : 1);
  }

  const cwd = process.cwd();
  const config = loadConfig('workflows');
  const root = stateRoot(cwd, config);

  let state;
  let dir;

  if (args.resume) {
    dir = runDir(root, args.resume);
    state = readState(dir);
    if (!state) {
      console.error(`No run state found for ${args.resume} under ${root}.`);
      process.exit(1);
    }
    if (state.status === 'running' && pidAlive(state.pid)) {
      console.error(`Run ${args.resume} is still running (pid ${state.pid}). Stop it first: node status.mjs --stop ${args.resume}`);
      process.exit(1);
    }
    const validation = validateWorkflowSpec(state.workflow);
    if (!validation.valid) {
      console.error(`Stored workflow for ${args.resume} is invalid:`);
      for (const error of validation.errors) console.error(`  - ${error}`);
      process.exit(1);
    }
    state.workflow = validation.normalized;
    for (const phase of state.phases) {
      if (phase.status !== 'completed') phase.status = 'pending';
    }
    delete state.error;
    delete state.finishedAt;
    preflightOrExit(cwd, config, state.workflow, args.runner);

    if (args.background) {
      const pid = spawnBackground(dir, ['--resume', args.resume, ...(args.runner ? ['--runner', args.runner] : [])]);
      console.log(`Resumed in background: ${args.resume} (pid ${pid})`);
      console.log(`State: ${path.join(dir, 'state.json')}`);
      console.log(`Check: node ${path.relative(cwd, path.join(path.dirname(SELF), 'status.mjs'))} ${args.resume}`);
      return;
    }
  } else {
    const { spec, maximumAgentCount, source } = loadWorkflowOrExit(cwd, args.ref);
    if (args.dryRun) {
      dryRun(cwd, config, spec, args.runner, maximumAgentCount);
      return;
    }
    preflightOrExit(cwd, config, spec, args.runner);
    const id = args.runId ?? newRunId();
    dir = runDir(root, id);
    state = {
      id,
      name: spec.name,
      status: 'starting',
      startedAt: new Date().toISOString(),
      cwd,
      source,
      workflow: spec,
      phases: pendingPhases(spec),
      outputs: {},
      previous: '',
    };

    if (args.background) {
      writeState(dir, state);
      const pid = spawnBackground(dir, [args.ref, '--run-id', id, ...(args.runner ? ['--runner', args.runner] : [])]);
      console.log(`Launched in background: ${id} (pid ${pid})`);
      console.log(`State: ${path.join(dir, 'state.json')}`);
      console.log(`Check: node ${path.relative(cwd, path.join(path.dirname(SELF), 'status.mjs'))} ${id}`);
      return;
    }
  }

  const ctx = buildStepContext(cwd, config, state.workflow, args.runner);
  const controller = new AbortController();
  let interrupted = false;
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (interrupted) process.exit(130);
      interrupted = true;
      console.error(`\nReceived ${signal} — stopping workflow (children are being terminated)…`);
      controller.abort();
    });
  }

  state.status = 'running';
  state.pid = process.pid;
  writeState(dir, state);
  console.log(`Run ${state.id} — ${state.name} (${state.phases.length} phases)`);

  await executeRun(state, dir, ctx, controller);

  if (state.status === 'completed') {
    const last = state.phases[state.phases.length - 1];
    console.log(`\nWorkflow completed. Final output: ${path.join(dir, last.outputFile ?? '')}`);
    process.exit(0);
  }
  if (state.status === 'stopped') {
    console.error(`\nWorkflow stopped. Resume with: node run.mjs --resume ${state.id}`);
    process.exit(130);
  }
  console.error(`\nWorkflow failed: ${state.error}`);
  console.error(`Resume (retries failed phase) with: node run.mjs --resume ${state.id}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
