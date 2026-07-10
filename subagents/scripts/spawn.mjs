#!/usr/bin/env node
/**
 * spawn.mjs --agent <name> --task <text> [--model <m>] [--thinking <t>] [--cwd <dir>] [--timeout <sec>]
 */
import { loadAgent } from './lib/agents.mjs';
import { runCursor } from './lib/backends/cursor.mjs';
import { runPi } from './lib/backends/pi.mjs';
import { parseFlags, strFlag } from './lib/cli.mjs';
import { loadConfig } from './lib/config.mjs';
import { die, fail } from './lib/die.mjs';
import { formatResult } from './lib/output.mjs';
import { resolveModelOpts } from './lib/routing.mjs';

function usage() {
  die(
    'Usage: node spawn.mjs --agent <name> --task <text> [--model <m>] [--thinking <t>] [--cwd <dir>] [--timeout <sec>]',
  );
}

async function main() {
  const { flags } = parseFlags(process.argv);
  if (flags.help) usage();
  const agentName = strFlag(flags, 'agent');
  const task = strFlag(flags, 'task');
  if (!agentName || !task) usage();

  const agent = loadAgent(agentName);
  if (agent.error) die(agent.error);

  const resolved = resolveModelOpts(agent, {
    model: strFlag(flags, 'model'),
    thinking: strFlag(flags, 'thinking'),
  });
  if (resolved.error) die(resolved.error);

  const cfg = loadConfig('subagents', { timeout: 600 });
  const timeoutSec = Number(strFlag(flags, 'timeout') ?? cfg.timeout ?? 600);
  if (!Number.isFinite(timeoutSec) || timeoutSec < 1) {
    die('--timeout must be a positive number of seconds');
  }
  const cwd = strFlag(flags, 'cwd') || process.cwd();
  const timeoutMs = Math.floor(timeoutSec) * 1000;
  const opts = {
    systemPrompt: agent.body,
    task,
    model: resolved.model,
    thinking: resolved.thinking,
    cwd,
    timeoutMs,
  };

  const result =
    resolved.backend === 'cursor' ? await runCursor(opts) : await runPi(opts);

  process.stdout.write(formatResult(agent.name, resolved.model, result.output));
  if (!result.ok) {
    die(`Agent "${agent.name}" exited ${result.code}`, result.code || 1);
  }
}

main().catch(fail);
