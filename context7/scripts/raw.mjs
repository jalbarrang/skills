#!/usr/bin/env node
/** raw.mjs --doc-ref <ref> — print the full raw cached document for a docs.mjs docRef. */
import { getDocCacheByRef } from './lib/cache-docs.mjs';
import { parseFlags } from './lib/cli.mjs';
import { die, fail } from './lib/die.mjs';
import { loadSettings } from './lib/settings.mjs';

function usage() {
  die('Usage: node raw.mjs --doc-ref <ref>');
}

async function main() {
  const { flags } = parseFlags(process.argv);
  const docRef = typeof flags['doc-ref'] === 'string' ? flags['doc-ref'] : undefined;
  if (!docRef || flags.help) usage();

  const settings = loadSettings();
  const cached = await getDocCacheByRef(settings, docRef);
  if (!cached.entry) {
    die(
      `No cached Context7 document found for docRef ${docRef}. Run docs.mjs first to fetch and cache it.`,
    );
  }
  console.log(cached.entry.rawText);
}

main().catch(fail);
