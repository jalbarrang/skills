import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCommand } from '../exec.mjs';

/**
 * Run via `pi -p --no-session --model --thinking --append-system-prompt <file>`.
 * Agent body goes in a temp system-prompt file; task is the user message.
 * @returns {Promise<{ ok: boolean, output: string, code: number }>}
 */
export async function runPi({ systemPrompt, task, model, thinking, cwd, timeoutMs }) {
  const tmp = path.join(
    os.tmpdir(),
    `subagents-pi-sys-${process.pid}-${Date.now()}.md`,
  );
  fs.writeFileSync(tmp, systemPrompt, 'utf8');
  try {
    const args = [
      '-p',
      '--no-session',
      '--model',
      model,
      '--thinking',
      thinking,
      '--append-system-prompt',
      tmp,
      task,
    ];
    const result = await runCommand('pi', args, { cwd, timeoutMs });
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    return { ok: result.code === 0, output, code: result.code };
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}
