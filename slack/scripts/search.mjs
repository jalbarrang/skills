#!/usr/bin/env node
import {
  parseArgs,
  usage,
  runMain,
  searchMessages,
  formatSearchResults,
  emitOutput,
} from './lib/slack.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length < 1 || flags.help) {
    usage([
      'node scripts/search.mjs <query> [--count N] [--sort score|timestamp] [--sort-dir asc|desc]',
    ]);
  }

  const query = positionals.join(' ');
  const count = flags.count !== undefined ? Number(flags.count) : undefined;
  if (flags.count !== undefined && (!Number.isFinite(count) || count < 1)) {
    usage([
      'node scripts/search.mjs <query> [--count N] [--sort score|timestamp] [--sort-dir asc|desc]',
    ]);
  }

  const sort = typeof flags.sort === 'string' ? flags.sort : undefined;
  if (sort && sort !== 'score' && sort !== 'timestamp') {
    usage([
      'node scripts/search.mjs <query> [--count N] [--sort score|timestamp] [--sort-dir asc|desc]',
    ]);
  }

  const sortDir = typeof flags['sort-dir'] === 'string' ? flags['sort-dir'] : undefined;
  if (sortDir && sortDir !== 'asc' && sortDir !== 'desc') {
    usage([
      'node scripts/search.mjs <query> [--count N] [--sort score|timestamp] [--sort-dir asc|desc]',
    ]);
  }

  const result = await searchMessages({
    query,
    count,
    sort,
    sortDir,
    cursor: typeof flags.cursor === 'string' ? flags.cursor : undefined,
  });

  emitOutput(formatSearchResults(result, query), result);
});
