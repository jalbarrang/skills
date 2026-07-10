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
