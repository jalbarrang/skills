#!/usr/bin/env node
/**
 * Resolve a review diff target and write it to a temp file.
 * Usage: node target.mjs [--branch <base>] [--commit <sha>] [--uncommitted]
 * Default: --uncommitted (staged + unstaged + untracked).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, runMain, usage } from './lib/cli.mjs';
import { collectBranch, collectCommit, collectUncommitted } from './lib/diff.mjs';
import { buildDigest, formatPayload } from './lib/digest.mjs';
import { die } from './lib/die.mjs';
import { assertGitRepo } from './lib/git.mjs';

const USAGE = [
  'node target.mjs [--uncommitted] [--branch <base>] [--commit <sha>]',
  '  --uncommitted  staged+unstaged+untracked vs HEAD (default)',
  '  --branch <base>  merge-base triple-dot diff: <base>...HEAD',
  '  --commit <sha>   that commit\'s patch',
];

runMain(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  const modes = [flags.uncommitted, flags.branch, flags.commit].filter((v) => v !== undefined);
  if (modes.length > 1) {
    die('Specify only one of --uncommitted, --branch <base>, or --commit <sha>.');
  }
  if (flags.help || flags.h) usage(USAGE);

  const repo = assertGitRepo();
  if (!repo.ok) die(repo.error);

  let result;
  if (flags.branch !== undefined) {
    if (flags.branch === true || flags.branch === '') {
      die('--branch requires a base ref (e.g. --branch main).');
    }
    result = collectBranch(process.cwd(), String(flags.branch));
  } else if (flags.commit !== undefined) {
    if (flags.commit === true || flags.commit === '') {
      die('--commit requires a commit sha (e.g. --commit HEAD~1).');
    }
    result = collectCommit(process.cwd(), String(flags.commit));
  } else {
    result = collectUncommitted(process.cwd());
  }

  if (result.error) die(result.error);

  const payload = formatPayload(result);
  const tmp = path.join(os.tmpdir(), `code-reviewer-diff-${process.pid}-${Date.now()}.md`);
  fs.writeFileSync(tmp, payload, 'utf8');

  const digest = buildDigest(result);
  console.log(tmp);
  console.log(digest.line);
});
