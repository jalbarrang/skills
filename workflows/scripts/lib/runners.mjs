/**
 * Per-harness runner command composition. A runner is an argv template with `{prompt}`, `{system}`, `{model}`, `{thinking}`, and `{agent}` placeholders. Built-in defaults cover pi, Claude Code, Codex, and cursor-agent; config (`.agents/workflows.json` → `runners`) merges over them and `defaultRunner` selects one.
 *
 * Only the default runner's CLI (`pi`) is a hard dependency. The other templates exist so a workflow CAN target them, but nothing is spawned — and nothing needs to be installed — unless a step actually selects that runner. `commandOnPath` lets callers preflight this before launching anything.
 */
import fs from 'node:fs';
import path from 'node:path';

export const BUILTIN_RUNNERS = {
  pi: ['pi', '-p', '--no-session', '--model', '{model}', '--thinking', '{thinking}', '--append-system-prompt', '{system}', '{prompt}'],
  claude: ['claude', '-p', '--model', '{model}', '--append-system-prompt', '{system}', '{prompt}'],
  codex: ['codex', 'exec', '-m', '{model}', '{prompt}'],
  cursor: ['cursor-agent', '-p', '--model', '{model}', '{prompt}'],
};

const PLACEHOLDER = /\{(prompt|system|model|thinking|agent)\}/g;

/** Merge configured runners over the built-ins. Configured argv arrays replace same-named built-ins entirely. */
export function resolveRunners(config) {
  const merged = { ...BUILTIN_RUNNERS };
  const configured = config?.runners;
  if (configured && typeof configured === 'object' && !Array.isArray(configured)) {
    for (const [name, argv] of Object.entries(configured)) {
      if (Array.isArray(argv) && argv.length > 0 && argv.every((token) => typeof token === 'string')) {
        merged[name] = argv;
      } else {
        console.error(`workflows: runner "${name}" in config must be a non-empty array of strings; ignoring it.`);
      }
    }
  }
  return merged;
}

/** Pick a runner argv template by name or throw listing the available runners. */
export function requireRunner(runners, name) {
  const template = runners[name];
  if (!template) {
    throw new Error(`Unknown runner: "${name}". Available: ${Object.keys(runners).join(', ')}. Configure runners in .agents/workflows.json.`);
  }
  return template;
}

/**
 * Compose a spawnable argv from a runner template and step values.
 *
 * Rules: if the template has no `{system}` token but a system prompt exists, it is prepended to the prompt (separated by `---`). A token that consists solely of a placeholder resolving to an empty value is dropped, along with the immediately preceding token when that token is a flag (starts with `-`).
 */
export function composeCommand(templateArgv, values) {
  const hasSystemSlot = templateArgv.some((token) => token.includes('{system}'));
  const system = values.system ?? '';
  let prompt = values.prompt ?? '';
  if (!hasSystemSlot && system) {
    prompt = `${system}\n\n---\n\n${prompt}`;
  }
  const resolved = { prompt, system, model: values.model ?? '', thinking: values.thinking ?? '', agent: values.agent ?? '' };

  const argv = [];
  for (const token of templateArgv) {
    const soloMatch = /^\{(prompt|system|model|thinking|agent)\}$/.exec(token);
    if (soloMatch) {
      const value = resolved[soloMatch[1]];
      if (!value) {
        if (argv.length > 0 && argv[argv.length - 1].startsWith('-')) argv.pop();
        continue;
      }
      argv.push(value);
      continue;
    }
    argv.push(token.replace(PLACEHOLDER, (_match, key) => resolved[key]));
  }
  if (argv.length === 0) throw new Error('Runner template resolved to an empty command.');
  return argv;
}

/** True when `command` resolves to an executable: absolute/relative paths are checked directly, bare names are searched on PATH. */
export function commandOnPath(command) {
  if (!command) return false;
  if (command.includes(path.sep)) {
    try {
      fs.accessSync(command, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
  const dirs = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
  return dirs.some((dir) => {
    try {
      fs.accessSync(path.join(dir, command), fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}
