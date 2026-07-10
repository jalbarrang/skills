#!/usr/bin/env node
/** read.mjs <channel> [--limit N] [--before <msgId>] [--after <msgId>] — message history. */
import { parseArgs, usage, runMain, getDiscordConfig } from './lib/cli.mjs';
import { readMessages } from './lib/messages.mjs';
import { formatMessages } from './lib/format.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length < 1 || flags.help) {
    usage(['node scripts/read.mjs <channel> [--limit N] [--before <msgId>] [--after <msgId>]']);
  }

  const channel = positionals[0];
  const config = getDiscordConfig();
  const limit =
    flags.limit !== undefined
      ? Number(flags.limit)
      : config.messageLimit !== undefined
        ? Number(config.messageLimit)
        : 50;

  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    usage(['node scripts/read.mjs <channel> [--limit N] [--before <msgId>] [--after <msgId>]']);
  }

  const result = await readMessages({
    channel,
    limit,
    before: typeof flags.before === 'string' ? flags.before : undefined,
    after: typeof flags.after === 'string' ? flags.after : undefined,
  });

  console.log(formatMessages(result, channel));
});
