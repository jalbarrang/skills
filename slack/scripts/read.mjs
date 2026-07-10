#!/usr/bin/env node
import {
  parseArgs,
  usage,
  runMain,
  readMessages,
  formatMessages,
  emitOutput,
  getSlackConfig,
} from './lib/slack.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length < 1 || flags.help) {
    usage(['node scripts/read.mjs <channel> [--oldest ts] [--latest ts] [--limit N] [--cursor c]']);
  }

  const channel = positionals[0];
  const config = getSlackConfig();
  const limit =
    flags.limit !== undefined
      ? Number(flags.limit)
      : config.messageLimit !== undefined
        ? Number(config.messageLimit)
        : undefined;

  if (flags.limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
    usage(['node scripts/read.mjs <channel> [--oldest ts] [--latest ts] [--limit N] [--cursor c]']);
  }

  const result = await readMessages({
    channel,
    limit,
    oldest: typeof flags.oldest === 'string' ? flags.oldest : undefined,
    latest: typeof flags.latest === 'string' ? flags.latest : undefined,
    cursor: typeof flags.cursor === 'string' ? flags.cursor : undefined,
  });

  emitOutput(formatMessages(result, channel), result);
});
