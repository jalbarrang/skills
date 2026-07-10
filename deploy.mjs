#!/usr/bin/env node
/**
 * Local dev sync: copy each repo skill dir (has SKILL.md) into ~/.agents/skills/<name>.
 * Never deletes or touches unrelated directories under ~/.agents/skills.
 *
 * Usage:
 *   node deploy.mjs              # sync all skills
 *   node deploy.mjs --dry-run    # print what would be copied
 *   node deploy.mjs --only name  # sync a single skill
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.dirname(fileURLToPath(import.meta.url));
const DEST_ROOT = path.join(os.homedir(), '.agents', 'skills');

function parseArgs(argv) {
  const opts = { dryRun: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--only') {
      const name = argv[++i];
      if (!name || name.startsWith('-')) {
        console.error('deploy: --only requires a skill name');
        process.exit(1);
      }
      opts.only = name;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node deploy.mjs [--dry-run] [--only <name>]`);
      process.exit(0);
    } else {
      console.error(`deploy: unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return opts;
}

function discoverSkills(repoRoot) {
  const entries = fs.readdirSync(repoRoot, { withFileTypes: true });
  const skills = [];
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
    const skillMd = path.join(repoRoot, ent.name, 'SKILL.md');
    if (fs.existsSync(skillMd)) skills.push(ent.name);
  }
  return skills.sort();
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  let skills = discoverSkills(REPO_ROOT);

  if (opts.only) {
    if (!skills.includes(opts.only)) {
      console.error(`deploy: skill not found in repo: ${opts.only}`);
      console.error(`deploy: available: ${skills.join(', ')}`);
      process.exit(1);
    }
    skills = [opts.only];
  }

  if (skills.length === 0) {
    console.error('deploy: no skill directories (with SKILL.md) found at repo root');
    process.exit(1);
  }

  if (!opts.dryRun) {
    fs.mkdirSync(DEST_ROOT, { recursive: true });
  }

  const synced = [];
  for (const name of skills) {
    const src = path.join(REPO_ROOT, name);
    const dest = path.join(DEST_ROOT, name);
    if (opts.dryRun) {
      console.log(`would copy: ${src} -> ${dest}`);
    } else {
      fs.cpSync(src, dest, { recursive: true, force: true });
      console.log(`copied: ${name} -> ${dest}`);
    }
    synced.push(name);
  }

  console.log('');
  console.log(
    opts.dryRun
      ? `dry-run: ${synced.length} skill(s) would sync: ${synced.join(', ')}`
      : `synced ${synced.length} skill(s): ${synced.join(', ')}`,
  );
}

try {
  main();
} catch (err) {
  console.error(`deploy: ${err.message || err}`);
  process.exit(1);
}
