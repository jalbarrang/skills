#!/usr/bin/env node
import {
  parseArgs,
  usage,
  runMain,
  postMessage,
  formatPostedMessage,
  emitOutput,
} from './lib/slack.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length < 2 || flags.help) {
    usage(['node scripts/post.mjs <channel> <text> [--thread ts] [--broadcast]']);
  }

  const channel = positionals[0];
  const text = positionals.slice(1).join(' ');
  const threadTs = typeof flags.thread === 'string' ? flags.thread : undefined;
  const replyBroadcast = flags.broadcast === true || flags.broadcast === 'true';

  const result = await postMessage({
    channel,
    text,
    threadTs,
    replyBroadcast: threadTs ? replyBroadcast : undefined,
  });

  emitOutput(formatPostedMessage(result, threadTs), result);
});
