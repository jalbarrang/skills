/**
 * Atlassian CLI (acli) wrappers — ported from the pi jira extension acli.ts.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function buildAuthStatusArgs() {
  return ['jira', 'auth', 'status'];
}

export function buildViewArgs(key, fields) {
  return ['jira', 'workitem', 'view', key, '--fields', fields, '--json'];
}

export function buildSearchArgs({ jql, limit, fields }) {
  const args = ['jira', 'workitem', 'search', '--jql', jql, '--limit', String(limit)];
  if (fields) {
    args.push('--fields', fields);
  }
  args.push('--json');
  return args;
}

export function buildCommentListArgs(key, limit) {
  return ['jira', 'workitem', 'comment', 'list', '--key', key, '--limit', String(limit), '--json'];
}

export function buildCommentCreateArgs(key, body) {
  return ['jira', 'workitem', 'comment', 'create', '--key', key, '--body', body, '--json'];
}

export class AcliError extends Error {
  /**
   * @param {'binary_not_found' | 'not_authenticated' | 'command_failed'} code
   * @param {string} message
   * @param {{ stderr?: string; exitCode?: number }} [options]
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'AcliError';
    this.code = code;
    this.stderr = options.stderr ?? '';
    this.exitCode = options.exitCode;
  }
}

/** Recognises the auth-failure signature in acli stderr output. */
export function looksUnauthenticated(text) {
  const t = text.toLowerCase();
  return (
    t.includes('not authenticated') ||
    t.includes('please authenticate') ||
    t.includes('no active session') ||
    t.includes('auth login') ||
    t.includes('unauthorized') ||
    t.includes('401')
  );
}

/**
 * Runs the acli binary and returns stdout/stderr.
 * @param {string} bin
 * @param {string[]} args
 * @returns {Promise<{ stdout: string; stderr: string }>}
 */
export async function runAcli(bin, args) {
  try {
    const { stdout, stderr } = await execFileAsync(bin, args, {
      maxBuffer: 32 * 1024 * 1024,
      encoding: 'utf-8',
    });
    return { stdout, stderr };
  } catch (err) {
    const e = /** @type {NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: unknown }} */ (
      err
    );

    if (e.code === 'ENOENT') {
      throw new AcliError(
        'binary_not_found',
        'Atlassian CLI (acli) not found. Install acli and ensure it is on PATH, then run `acli jira auth login`.',
      );
    }

    const stderr = e.stderr ?? '';
    const stdout = e.stdout ?? '';
    const combined = `${stderr}\n${stdout}`;

    if (looksUnauthenticated(combined)) {
      throw new AcliError(
        'not_authenticated',
        'No authenticated Atlassian CLI session. Run `acli jira auth login`.',
        { stderr },
      );
    }

    const exitCode = typeof e.code === 'number' ? e.code : undefined;
    const detail = (stderr.trim() || stdout.trim() || e.message || 'unknown error').slice(0, 2000);
    throw new AcliError('command_failed', `acli command failed: ${detail}`, { stderr, exitCode });
  }
}

/**
 * Verifies an authenticated acli session via `acli jira auth status`.
 * @param {string} bin
 * @returns {Promise<{ authenticated: boolean; message: string }>}
 */
export async function checkAuth(bin) {
  try {
    const { stdout, stderr } = await runAcli(bin, buildAuthStatusArgs());
    const text = `${stdout}\n${stderr}`.trim();
    if (looksUnauthenticated(text)) {
      return { authenticated: false, message: text || 'No active session.' };
    }
    return { authenticated: true, message: text || 'Authenticated.' };
  } catch (err) {
    if (err instanceof AcliError) {
      return { authenticated: false, message: err.message };
    }
    return { authenticated: false, message: /** @type {Error} */ (err).message };
  }
}

/** Parses acli `--json` stdout, tolerating leading/trailing non-JSON noise. */
export function parseJsonOutput(stdout) {
  const trimmed = stdout.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.search(/[[{]/);
    if (start > 0) {
      try {
        return JSON.parse(trimmed.slice(start));
      } catch {
        /* fall through */
      }
    }
    throw new AcliError('command_failed', 'Could not parse acli JSON output.');
  }
}

/**
 * Print one actionable stderr line for acli failures and exit 1.
 * @param {unknown} err
 */
export function failAcli(err) {
  if (err instanceof AcliError) {
    console.error(err.message);
  } else {
    console.error(/** @type {Error} */ (err).message || String(err));
  }
  process.exit(1);
}
