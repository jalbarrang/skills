#!/usr/bin/env node
/** download.mjs <attachment-url> — save a Discord CDN attachment to a temp path. */
import { parseArgs, usage, runMain } from './lib/cli.mjs';
import { downloadAttachment } from './lib/attachments.mjs';
import { formatDownloadedAttachment } from './lib/format.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length < 1 || flags.help) {
    usage(['node scripts/download.mjs <attachment-url>']);
  }

  const url = positionals[0];
  const result = await downloadAttachment(url);
  console.log(formatDownloadedAttachment(result));
});
