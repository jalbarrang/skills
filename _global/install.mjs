#!/usr/bin/env node
/**
 * Symlink the canonical _global/AGENTS.md into every harness's global-instructions mount point.
 * Existing regular files are backed up to <path>.bak once; existing correct symlinks are left alone.
 * Cursor has no file mount for global User Rules — paste the content into Customize → Rules manually.
 *
 * Usage: node _global/install.mjs [--dry-run]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CANONICAL = path.join(path.dirname(fileURLToPath(import.meta.url)), 'AGENTS.md');
const HOME = os.homedir();

/** [mount point, only link when this harness dir already exists (null = always)] */
const MOUNTS = [
  [path.join(HOME, '.agents', 'AGENTS.md'), null],
  [path.join(HOME, '.pi', 'agent', 'AGENTS.md'), path.join(HOME, '.pi', 'agent')],
  [path.join(HOME, '.claude', 'CLAUDE.md'), path.join(HOME, '.claude')],
  [path.join(HOME, '.codex', 'AGENTS.md'), path.join(HOME, '.codex')],
  [path.join(HOME, '.gemini', 'GEMINI.md'), path.join(HOME, '.gemini')],
];

const dryRun = process.argv.includes('--dry-run');

function install(target) {
  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) {
      if (fs.readlinkSync(target) === CANONICAL) return 'ok (already linked)';
      if (dryRun) return 'would relink';
      fs.unlinkSync(target);
    } else {
      if (dryRun) return `would back up to ${path.basename(target)}.bak and link`;
      fs.renameSync(target, `${target}.bak`);
    }
  } else if (dryRun) {
    return 'would link';
  }
  if (dryRun) return 'would link';
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.symlinkSync(CANONICAL, target);
  return 'linked';
}

if (!fs.existsSync(CANONICAL)) {
  console.error(`Canonical file missing: ${CANONICAL}`);
  process.exit(1);
}

for (const [target, requiredDir] of MOUNTS) {
  if (requiredDir && !fs.existsSync(requiredDir)) {
    console.log(`skip   ${target} (harness not present)`);
    continue;
  }
  console.log(`${install(target).padEnd(6)} ${target}`);
}

console.log('\nCursor: no file mount for global User Rules — paste _global/AGENTS.md into Cursor → Settings → Rules once.');
