#!/usr/bin/env node
import {
  parseArgs,
  usage,
  runMain,
  editMessage,
  formatEditedMessage,
  emitOutput,
} from './lib/slack.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length < 3 || flags.help) {
    usage(['node scripts/edit.mjs <channel> <ts> <text>']);
  }

  const channel = positionals[0];
  const ts = positionals[1];
  const text = positionals.slice(2).join(' ');

  const result = await editMessage({ channel, ts, text });
  emitOutput(formatEditedMessage(result), result);
});
