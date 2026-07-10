#!/usr/bin/env node
/** channels.mjs [--guild <id>] — list text channels in a guild. */
import { parseArgs, usage, runMain, getDiscordConfig } from './lib/cli.mjs';
import { die } from './lib/die.mjs';
import { listChannels } from './lib/channels.mjs';
import { formatChannelList } from './lib/format.mjs';

await runMain(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  if (positionals.length > 0 || flags.help) {
    usage(['node scripts/channels.mjs [--guild <id>]']);
  }

  const config = getDiscordConfig();
  const guild =
    typeof flags.guild === 'string'
      ? flags.guild
      : typeof config.defaultGuild === 'string'
        ? config.defaultGuild
        : undefined;

  if (!guild) {
    die(
      'No guild specified. Pass --guild <id> or set "defaultGuild" in .agents/discord.json (or ~/.agents/discord.json).',
    );
  }

  const result = await listChannels({ guild });
  console.log(formatChannelList(result.channels, guild));
});
