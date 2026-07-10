import { spawn } from 'node:child_process';

/**
 * Spawn a command, capture stdout/stderr, kill on timeout.
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
export function runCommand(cmd, args, { cwd, timeoutMs, env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: cwd || process.cwd(),
      env: env ?? process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (d) => {
      stdout += d;
    });
    child.stderr.on('data', (d) => {
      stderr += d;
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') {
        const hint =
          cmd === 'cursor-agent'
            ? 'cursor-agent is not installed. Install Cursor CLI (https://cursor.com/cli) and run `agent login`, or use a non-cursor model to route through pi.'
            : `\`${cmd}\` is not on PATH. Models without a \`cursor:\` prefix run through the pi CLI; install pi, or pass --model cursor:<model> to use cursor-agent instead.`;
        reject(new Error(`Backend not found: ${cmd}. ${hint}`));
        return;
      }
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(
          new Error(
            `Timed out after ${Math.round(timeoutMs / 1000)}s running: ${cmd} ${args.join(' ')}`,
          ),
        );
        return;
      }
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}
