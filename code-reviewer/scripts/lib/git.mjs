/** Thin git exec helpers. Failures return { ok:false, stderr } instead of throwing. */
import { execFileSync } from 'node:child_process';

const TIMEOUT_MS = 30_000;

export function git(args, cwd = process.cwd()) {
  try {
    const stdout = execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      timeout: TIMEOUT_MS,
      maxBuffer: 50 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: stdout ?? '' };
  } catch (err) {
    const stdout = err.stdout?.toString?.() ?? '';
    const stderr = err.stderr?.toString?.() ?? err.message ?? String(err);
    // git diff --no-index exits 1 when files differ but still prints the diff
    if (stdout && /diff --git|diff --cc/.test(stdout)) {
      return { ok: true, stdout };
    }
    return { ok: false, stdout, stderr: stderr.trim() };
  }
}

export function assertGitRepo(cwd = process.cwd()) {
  const r = git(['rev-parse', '--is-inside-work-tree'], cwd);
  if (!r.ok || r.stdout.trim() !== 'true') {
    return { ok: false, error: `Not a git repository: ${cwd}` };
  }
  return { ok: true };
}

export function splitPaths(stdout) {
  return stdout
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
}
