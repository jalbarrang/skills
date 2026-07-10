#!/usr/bin/env node
/**
 * comments.mjs <key> [--limit N]
 * Comment thread digest (most recent); full thread to a temp file.
 */
import { AcliError, buildCommentListArgs, failAcli, parseJsonOutput, runAcli } from './lib/acli.mjs';
import { loadJiraConfig, qualifyKey } from './lib/defaults.mjs';
import { formatCommentsDigest, formatCommentsFull } from './lib/format.mjs';
import { writeContextFile } from './lib/output.mjs';

function usage() {
  console.error('Usage: node comments.mjs <key> [--limit N]');
  console.error('  key     Work item key (e.g. PROJ-123). Bare number uses defaultProject from config.');
  console.error('  --limit Max comments (1-100). Default 50.');
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let key;
  let limit;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--limit') {
      const raw = args[++i];
      if (!raw || !/^\d+$/.test(raw)) usage();
      limit = Number(raw);
      if (limit < 1 || limit > 100) usage();
      continue;
    }
    if (a.startsWith('-')) usage();
    if (key !== undefined) usage();
    key = a;
  }
  if (!key) usage();
  return { key, limit };
}

async function main() {
  const { key: rawKey, limit: limitOverride } = parseArgs(process.argv);
  const cfg = loadJiraConfig();
  const key = qualifyKey(rawKey, cfg.defaultProject);
  const limit = limitOverride ?? 50;

  try {
    const { stdout } = await runAcli(cfg.acliPath, buildCommentListArgs(key, limit));
    const payload = parseJsonOutput(stdout);
    const comments = Array.isArray(payload) ? payload : (payload.comments ?? []);
    let file;
    if (comments.length > 0) {
      try {
        file = await writeContextFile(formatCommentsFull(comments, key), `${key.toLowerCase()}-comments`);
      } catch {
        file = undefined;
      }
    }
    console.log(formatCommentsDigest(comments, key, file));
  } catch (err) {
    failAcli(err);
  }
}

main().catch((err) => {
  if (err instanceof AcliError) failAcli(err);
  console.error(err?.message || String(err));
  process.exit(1);
});
