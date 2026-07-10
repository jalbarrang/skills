#!/usr/bin/env node
/** resolve.mjs <libraryName> [--query <intent>] — candidate Context7 library IDs. */
import { parseFlags } from './lib/cli.mjs';
import { die, fail } from './lib/die.mjs';
import { formatResolveResults } from './lib/format.mjs';
import { resolveLibraries } from './lib/resolve-flow.mjs';

function usage() {
  die('Usage: node resolve.mjs <libraryName> [--query <intent>]');
}

async function main() {
  const { flags, positionals, ok } = parseFlags(process.argv, { positional: 1 });
  if (!ok) usage();
  const libraryName = positionals[0];
  if (!libraryName || flags.help) usage();
  const query = typeof flags.query === 'string' ? flags.query : undefined;

  const resolved = await resolveLibraries({ libraryName, query });
  const formatted = formatResolveResults(resolved.response, libraryName);
  const notes = [];
  if (resolved.source === 'fresh-cache') notes.push('(cache hit)');
  if (resolved.source === 'stale-cache') notes.push('(stale cache)');
  console.log([formatted.text, notes.join(' ')].filter(Boolean).join('\n\n'));
}

main().catch(fail);
