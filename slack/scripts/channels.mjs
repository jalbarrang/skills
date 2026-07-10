#!/usr/bin/env node
import {
  parseArgs,
  usage,
  runMain,
  listChannels,
  formatChannelList,
  emitOutput,
} from './lib/slack.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length > 0 || flags.help) {
    usage(['node scripts/channels.mjs [--types t] [--limit N] [--cursor c]']);
  }

  const limit = flags.limit !== undefined ? Number(flags.limit) : undefined;
  if (flags.limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
    usage(['node scripts/channels.mjs [--types t] [--limit N] [--cursor c]']);
  }

  const result = await listChannels({
    limit,
    cursor: typeof flags.cursor === 'string' ? flags.cursor : undefined,
    types: typeof flags.types === 'string' ? flags.types : undefined,
  });

  emitOutput(formatChannelList(result.channels, result.cursor), result);
});
