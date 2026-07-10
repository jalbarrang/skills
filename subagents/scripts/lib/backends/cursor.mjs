import { cursorModelId } from '../routing.mjs';
import { runCommand } from '../exec.mjs';

/**
 * Run via `cursor-agent -p --model --output-format text [--workspace]`.
 * Full prompt = agent system + task (no separate system-prompt flag).
 * @returns {Promise<{ ok: boolean, output: string, code: number }>}
 */
export async function runCursor({ systemPrompt, task, model, cwd, timeoutMs }) {
  const modelId = cursorModelId(model);
  const prompt = `${systemPrompt.trim()}\n\n---\n\n## Task\n\n${task}`;
  const args = ['-p', '--model', modelId, '--output-format', 'text', '--force'];
  if (cwd) {
    args.push('--workspace', cwd);
  }
  args.push(prompt);
  const result = await runCommand('cursor-agent', args, { cwd, timeoutMs });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  return { ok: result.code === 0, output, code: result.code };
}
