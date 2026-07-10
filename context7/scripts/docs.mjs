#!/usr/bin/env node
/**
 * docs.mjs (--name <lib> | --id </org/lib>) [--query <q>] [--topic <t>] [--page <n>]
 * Auto-resolves names, fetches curated docs, prints excerpt + docRef.
 */
import { parseFlags } from './lib/cli.mjs';
import { die, fail } from './lib/die.mjs';
import { getDocsEntry } from './lib/docs-flow.mjs';

function usage() {
  die(
    'Usage: node docs.mjs (--name <lib> | --id </org/lib>) [--query <q>] [--topic <t>] [--page <n>]',
  );
}

function parsePage(raw) {
  if (raw === undefined || raw === true) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) usage();
  return Math.floor(n);
}

async function main() {
  const { flags } = parseFlags(process.argv);
  if (flags.help) usage();
  const libraryName = typeof flags.name === 'string' ? flags.name : undefined;
  const libraryId = typeof flags.id === 'string' ? flags.id : undefined;
  if (!libraryName && !libraryId) usage();

  const result = await getDocsEntry({
    libraryName,
    libraryId,
    query: typeof flags.query === 'string' ? flags.query : undefined,
    topic: typeof flags.topic === 'string' ? flags.topic : undefined,
    page: parsePage(flags.page),
  });

  if (!result.ok) {
    console.log(result.text);
    process.exit(1);
  }

  const marker =
    result.source === 'fresh-cache'
      ? '(cache hit)'
      : result.source === 'stale-cache'
        ? '(stale cache)'
        : undefined;
  const lines = [result.entry.curatedText];
  if (marker) lines.push('', marker);
  lines.push('', `docRef: ${result.entry.docRef}`);
  console.log(lines.join('\n'));
}

main().catch(fail);
