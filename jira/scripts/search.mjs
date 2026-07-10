#!/usr/bin/env node
/**
 * search.mjs <jql> [--limit N]
 * JQL search; print compact list; write full results to a temp file.
 */
import { AcliError, buildSearchArgs, failAcli, parseJsonOutput, runAcli } from './lib/acli.mjs';
import { loadJiraConfig } from './lib/defaults.mjs';
import { extractIssues, formatSearchDigest, formatSearchFull } from './lib/format.mjs';
import { writeContextFile } from './lib/output.mjs';

function usage() {
  console.error('Usage: node search.mjs <jql> [--limit N]');
  console.error('  jql      JQL query (quote it in the shell).');
  console.error('  --limit  Max results (1-100). Defaults to searchLimit from config or 25.');
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let jql;
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
    if (jql !== undefined) usage();
    jql = a;
  }
  if (!jql) usage();
  return { jql, limit };
}

async function main() {
  const { jql, limit: limitOverride } = parseArgs(process.argv);
  const cfg = loadJiraConfig();
  const limit = limitOverride ?? cfg.searchLimit;

  // Request description-bearing fields so the temp-file payload matches the skill contract
  // ("full results with descriptions"). acli search defaults omit description.
  const searchFields = 'summary,issuetype,status,priority,assignee,reporter,labels,description';

  try {
    const { stdout } = await runAcli(
      cfg.acliPath,
      buildSearchArgs({ jql, limit, fields: searchFields }),
    );
    const issues = extractIssues(parseJsonOutput(stdout));
    let file;
    if (issues.length > 0) {
      try {
        file = await writeContextFile(formatSearchFull(issues), 'search');
      } catch {
        file = undefined;
      }
    }
    console.log(formatSearchDigest(issues, file));
  } catch (err) {
    failAcli(err);
  }
}

main().catch((err) => {
  if (err instanceof AcliError) failAcli(err);
  console.error(err?.message || String(err));
  process.exit(1);
});
