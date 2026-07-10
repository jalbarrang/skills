#!/usr/bin/env node
/**
 * view.mjs <key> [--fields <csv>]
 * Fetch a Jira work item; print compact digest; write full ticket to a temp file.
 */
import { AcliError, buildViewArgs, failAcli, parseJsonOutput, runAcli } from './lib/acli.mjs';
import { loadJiraConfig, qualifyKey } from './lib/defaults.mjs';
import { formatWorkItemDigest, formatWorkItemFull } from './lib/format.mjs';
import { writeContextFile } from './lib/output.mjs';

function usage() {
  console.error('Usage: node view.mjs <key> [--fields <csv>]');
  console.error('  key     Work item key (e.g. PROJ-123). Bare number uses defaultProject from config.');
  console.error('  --fields  Optional comma-separated acli field set override.');
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let key;
  let fields;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--fields') {
      fields = args[++i];
      if (!fields) usage();
      continue;
    }
    if (a.startsWith('-')) usage();
    if (key !== undefined) usage();
    key = a;
  }
  if (!key) usage();
  return { key, fields };
}

async function main() {
  const { key: rawKey, fields: fieldsOverride } = parseArgs(process.argv);
  const cfg = loadJiraConfig();
  const key = qualifyKey(rawKey, cfg.defaultProject);
  const fields = fieldsOverride ?? cfg.viewFields;

  try {
    const { stdout } = await runAcli(cfg.acliPath, buildViewArgs(key, fields));
    const issue = parseJsonOutput(stdout);
    const full = formatWorkItemFull(issue);
    let file;
    try {
      file = await writeContextFile(full, key.toLowerCase());
    } catch {
      file = undefined;
    }
    console.log(formatWorkItemDigest(issue, file));
  } catch (err) {
    failAcli(err);
  }
}

main().catch((err) => {
  if (err instanceof AcliError) failAcli(err);
  console.error(err?.message || String(err));
  process.exit(1);
});
