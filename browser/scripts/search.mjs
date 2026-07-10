#!/usr/bin/env node
/**
 * search.mjs <query> [--engine ddg|google|brave] [--allow <domains>] [--block <domains>] [--limit N]
 */
import { loadConfig } from './lib/config.mjs';
import { searchBrave } from './lib/engines/brave.mjs';
import { searchDuckDuckGo } from './lib/engines/ddg.mjs';
import { searchGoogle } from './lib/engines/google.mjs';
import { filterResults, formatResults } from './lib/filter.mjs';

function usage() {
  console.error('Usage: node search.mjs <query> [--engine ddg|google|brave] [--allow domains] [--block domains] [--limit N]');
  console.error('  --engine  Search backend (default: ddg, or WEB_SEARCH_PROVIDER from config)');
  console.error('  --allow   Comma-separated allowed domains');
  console.error('  --block   Comma-separated blocked domains');
  console.error('  --limit   Max results (default 10)');
  process.exit(1);
}

function splitDomains(raw) {
  return String(raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let query;
  let engine;
  let allow = [];
  let block = [];
  let limit = 10;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--engine') {
      engine = args[++i];
      if (!['ddg', 'duckduckgo', 'google', 'brave'].includes(engine)) usage();
      continue;
    }
    if (a === '--allow') { allow = splitDomains(args[++i]); continue; }
    if (a === '--block') { block = splitDomains(args[++i]); continue; }
    if (a === '--limit') {
      const n = Number(args[++i]);
      if (!Number.isFinite(n) || n < 1) usage();
      limit = Math.min(Math.floor(n), 20);
      continue;
    }
    if (a.startsWith('-')) usage();
    if (query !== undefined) usage();
    query = a;
  }
  if (!query) usage();
  return { query, engine, allow, block, limit };
}

async function runEngine(engine, query, cfg) {
  if (engine === 'google') return searchGoogle(query, cfg);
  if (engine === 'brave') return searchBrave(query, cfg);
  return searchDuckDuckGo(query);
}

async function main() {
  const opts = parseArgs(process.argv);
  const cfg = loadConfig('browser');
  const raw = (opts.engine ?? cfg.WEB_SEARCH_PROVIDER ?? 'ddg').toLowerCase();
  const engine = raw === 'duckduckgo' ? 'ddg' : raw;
  const rawResults = await runEngine(engine, opts.query, cfg);
  const results = filterResults(rawResults, opts);
  console.log(formatResults(results));
}

main().catch((err) => {
  console.error(err?.message || String(err));
  process.exit(1);
});
