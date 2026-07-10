/** Human-readable digests for channels, messages, and downloads. */

const CHANNEL_TYPE_LABEL = {
  0: '#',
  5: '📣',
  10: '🧵',
  11: '🧵',
  12: '🧵',
  15: '🗂️',
};

export function formatChannelList(channels, guildId) {
  if (channels.length === 0) return `No text channels found in guild ${guildId}.`;
  const lines = channels.map((ch) => {
    const marker = CHANNEL_TYPE_LABEL[ch.type] ?? '#';
    const topic = ch.topic ? ` — ${ch.topic}` : '';
    return `${marker} **${ch.name}** (${ch.id})${topic}`;
  });
  return `**Channels** in guild ${guildId} (${channels.length}):\n\n${lines.join('\n')}`;
}

function formatTimestamp(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

function formatSingleMessage(msg) {
  const time = formatTimestamp(msg.timestamp);
  const bot = msg.isBot ? ' [bot]' : '';
  const edited = msg.editedTimestamp ? ' (edited)' : '';
  const reactions = msg.reactions
    ? ` ${msg.reactions.map((r) => `${r.name} ${r.count}`).join(' ')}`
    : '';
  const attachments = msg.attachments
    ? `\n  📎 ${msg.attachments.map((a) => `${a.filename} (${a.url})`).join(', ')}`
    : '';
  return `[${time}] **${msg.author}**${bot}${edited}: ${msg.content}${reactions}${attachments}`;
}

/** Present oldest-first (Discord API returns newest-first). */
export function formatMessages(result, channelId) {
  if (result.messages.length === 0) return `No messages found in channel ${channelId}.`;
  const ordered = [...result.messages].reverse();
  const header = `**Messages** in ${channelId} (${ordered.length}):`;
  return `${header}\n\n${ordered.map(formatSingleMessage).join('\n\n')}`;
}

export function formatDownloadedAttachment(result) {
  const header = `📎 **${result.filename}**`;
  const hint = result.isImage
    ? `\n\n💡 This is an image. Use the \`read\` tool to view it:\n  \`read ${result.localPath}\``
    : `\n\n📁 Downloaded to: ${result.localPath}`;
  return `${header}${hint}`;
}
