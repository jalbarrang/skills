#!/usr/bin/env node
import {
  parseArgs,
  usage,
  runMain,
  readThread,
  formatThread,
  emitOutput,
} from './lib/slack.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length < 2 || flags.help) {
    usage(['node scripts/thread.mjs <channel> <thread_ts> [--limit N] [--cursor c]']);
  }

  const [channel, threadTs] = positionals;
  const limit = flags.limit !== undefined ? Number(flags.limit) : undefined;
  if (flags.limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
    usage(['node scripts/thread.mjs <channel> <thread_ts> [--limit N] [--cursor c]']);
  }

  const result = await readThread({
    channel,
    threadTs,
    limit,
    cursor: typeof flags.cursor === 'string' ? flags.cursor : undefined,
  });

  emitOutput(formatThread(result, channel, threadTs), result);
});
