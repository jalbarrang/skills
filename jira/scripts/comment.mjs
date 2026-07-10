#!/usr/bin/env node
/**
 * comment.mjs <key> <body>
 * Post a comment via acli. Confirm success on stdout.
 *
 * Etiquette: comments are team-visible. Agents must confirm exact wording with
 * the user before posting unless the user explicitly asked to post.
 */
import { AcliError, buildCommentCreateArgs, failAcli, runAcli } from './lib/acli.mjs';
import { loadJiraConfig, qualifyKey } from './lib/defaults.mjs';

function usage() {
  console.error('Usage: node comment.mjs <key> <body>');
  console.error('  key   Work item key (e.g. PROJ-123). Bare number uses defaultProject from config.');
  console.error('  body  Comment text (plain text). Keep it short and factual.');
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length < 2) usage();
  const key = args[0];
  const body = args.slice(1).join(' ');
  if (!key || key.startsWith('-')) usage();
  return { key, body };
}

async function main() {
  const { key: rawKey, body } = parseArgs(process.argv);
  if (!body.trim()) {
    console.error('Comment body is empty.');
    process.exit(1);
  }
  const cfg = loadJiraConfig();
  const key = qualifyKey(rawKey, cfg.defaultProject);

  try {
    await runAcli(cfg.acliPath, buildCommentCreateArgs(key, body));
    console.log(`Comment added to ${key}.`);
  } catch (err) {
    failAcli(err);
  }
}

main().catch((err) => {
  if (err instanceof AcliError) failAcli(err);
  console.error(err?.message || String(err));
  process.exit(1);
});
