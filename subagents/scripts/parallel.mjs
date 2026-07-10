#!/usr/bin/env node
/** parallel.mjs --tasks <file.json|inline JSON> — concurrent spawn.mjs children. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseFlags, strFlag } from './lib/cli.mjs';
import { die, fail } from './lib/die.mjs';
import { formatSummary } from './lib/output.mjs';

const SPAWN_PATH = fileURLToPath(new URL('./spawn.mjs', import.meta.url));

function usage() {
  die('Usage: node parallel.mjs --tasks <file.json|inline JSON array of {agent,task,model?,thinking?,cwd?}>');
}

function loadTasks(raw) {
  try {
    if (fs.existsSync(raw) && fs.statSync(raw).isFile()) {
      return JSON.parse(fs.readFileSync(raw, 'utf8'));
    }
    return JSON.parse(raw);
  } catch (err) {
    die(`Invalid --tasks JSON: ${err.message}`);
  }
}

function buildArgs(t) {
  const args = [SPAWN_PATH, '--agent', t.agent, '--task', t.task];
  if (t.model) args.push('--model', t.model);
  if (t.thinking) args.push('--thinking', t.thinking);
  if (t.cwd) args.push('--cwd', t.cwd);
  if (t.timeout != null) args.push('--timeout', String(t.timeout));
  return args;
}

function runChild(t) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, buildArgs(t), {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (err) => resolve({ ok: false, text: err.message }));
    child.on('close', (code) => {
      resolve({ ok: code === 0, text: [stdout, stderr].filter(Boolean).join('\n').trim() });
    });
  });
}

async function main() {
  const { flags } = parseFlags(process.argv);
  if (flags.help) usage();
  const raw = strFlag(flags, 'tasks');
  if (!raw) usage();
  const tasks = loadTasks(raw);
  if (!Array.isArray(tasks) || tasks.length === 0) die('--tasks must be a non-empty JSON array');
  for (const t of tasks) {
    if (!t?.agent || !t?.task) die('Each task needs {agent, task}');
  }

  let printChain = Promise.resolve();
  const print = (text) => {
    printChain = printChain.then(() => { console.log(text); console.log(''); });
    return printChain;
  };

  const results = await Promise.all(
    tasks.map(async (t) => {
      const r = await runChild(t);
      await print(r.text || `(no output from ${t.agent})`);
      return r;
    }),
  );

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.length - succeeded;
  console.log(formatSummary(succeeded, failed));
  if (failed > 0) process.exit(1);
}

main().catch(fail);
