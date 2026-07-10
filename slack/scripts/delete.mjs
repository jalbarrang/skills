#!/usr/bin/env node
import {
  parseArgs,
  usage,
  runMain,
  deleteMessage,
  formatDeletedMessage,
  emitOutput,
} from './lib/slack.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length < 2 || flags.help) {
    usage(['node scripts/delete.mjs <channel> <ts>']);
  }

  const [channel, ts] = positionals;
  const result = await deleteMessage({ channel, ts });
  emitOutput(formatDeletedMessage(result), result);
});
