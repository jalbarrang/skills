#!/usr/bin/env node
import {
  parseArgs,
  usage,
  runMain,
  downloadFile,
  formatDownloadedFile,
  emitOutput,
} from './lib/slack.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length < 1 || flags.help) {
    usage(['node scripts/download.mjs <fileId>']);
  }

  const fileId = positionals[0];
  const result = await downloadFile(fileId);
  emitOutput(formatDownloadedFile(result), result);
});
