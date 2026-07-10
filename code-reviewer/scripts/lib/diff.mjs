/** Collect diffs for uncommitted / branch (merge-base) / commit modes. */
import { git, splitPaths } from './git.mjs';

const MAX_UNTRACKED = 200;

function collectUntracked(cwd) {
  const listed = git(['ls-files', '--others', '--exclude-standard'], cwd);
  const files = listed.ok ? splitPaths(listed.stdout).slice(0, MAX_UNTRACKED) : [];
  const parts = [];
  for (const file of files) {
    const r = git(['diff', '--no-index', '--', '/dev/null', file], cwd);
    if (r.stdout?.trim()) parts.push(r.stdout);
  }
  return { diff: parts.join('\n'), files };
}

/** Default: staged + unstaged vs HEAD, plus untracked new files. */
export function collectUncommitted(cwd) {
  const head = git(['diff', 'HEAD'], cwd);
  const untracked = collectUntracked(cwd);
  let tracked = '';
  let stat = '';
  let label = 'all uncommitted changes';
  if (head.ok && head.stdout.trim()) {
    tracked = head.stdout;
    stat = git(['diff', 'HEAD', '--stat'], cwd).stdout || '';
  } else {
    tracked = git(['diff'], cwd).stdout || '';
    stat = git(['diff', '--stat'], cwd).stdout || '';
    label = 'working directory changes';
  }
  const names = [
    ...splitPaths(git(['diff', '--name-only', 'HEAD'], cwd).stdout || ''),
    ...untracked.files,
  ];
  const diff = [tracked, untracked.diff].filter((p) => p.trim()).join('\n');
  return { diff, files: [...new Set(names)], stat: appendUntrackedStat(stat, untracked.files), label };
}

function appendUntrackedStat(stat, files) {
  if (files.length === 0) return stat;
  const lines = files.map((f) => ` ${f} | (new, untracked)`);
  return [stat.trimEnd(), ...lines, `${files.length} untracked file(s) included`].filter(Boolean).join('\n');
}

/** Merge-base triple-dot diff against a base branch/ref. */
export function collectBranch(cwd, base) {
  const check = git(['rev-parse', '--verify', base], cwd);
  if (!check.ok) {
    return { error: `Unknown ref '${base}': ${check.stderr || 'not found'}` };
  }
  const range = `${base}...HEAD`;
  const diff = git(['diff', range], cwd);
  if (!diff.ok) return { error: `git diff ${range} failed: ${diff.stderr}` };
  const stat = git(['diff', range, '--stat'], cwd).stdout || '';
  const files = splitPaths(git(['diff', '--name-only', range], cwd).stdout || '');
  return { diff: diff.stdout, files, stat, label: `changes since merge-base with ${base}` };
}

/** Single-commit patch (parent..commit, or root commit). */
export function collectCommit(cwd, sha) {
  const check = git(['rev-parse', '--verify', `${sha}^{commit}`], cwd);
  if (!check.ok) {
    return { error: `Unknown commit '${sha}': ${check.stderr || 'not found'}` };
  }
  const resolved = check.stdout.trim();
  const parents = git(['rev-list', '--parents', '-n', '1', resolved], cwd);
  const parts = (parents.stdout || '').trim().split(/\s+/);
  const range = parts.length > 1 ? `${parts[1]}..${resolved}` : resolved;
  const diffArgs = parts.length > 1 ? ['diff', range] : ['show', '--format=', '--patch', resolved];
  const diff = git(diffArgs, cwd);
  if (!diff.ok) return { error: `git diff for ${sha} failed: ${diff.stderr}` };
  const statArgs = parts.length > 1 ? ['diff', range, '--stat'] : ['show', '--format=', '--stat', resolved];
  const nameArgs = parts.length > 1 ? ['diff', '--name-only', range] : ['show', '--format=', '--name-only', resolved];
  return {
    diff: diff.stdout,
    files: splitPaths(git(nameArgs, cwd).stdout || ''),
    stat: git(statArgs, cwd).stdout || '',
    label: `commit ${resolved.slice(0, 12)}`,
  };
}
