/** Read channel message history. Discord returns newest-first; callers may reverse for display. */
import { discordGet } from './api.mjs';

function normalizeAttachment(raw) {
  const att = {
    id: raw.id,
    filename: raw.filename,
    size: raw.size,
    url: raw.url,
  };
  if (raw.content_type) att.contentType = raw.content_type;
  if (raw.width !== undefined) att.width = raw.width;
  if (raw.height !== undefined) att.height = raw.height;
  return att;
}

function normalizeMessage(raw) {
  const msg = {
    id: raw.id,
    author: raw.author?.global_name || raw.author?.username || 'unknown',
    authorId: raw.author?.id ?? 'unknown',
    isBot: Boolean(raw.author?.bot),
    content: raw.content ?? '',
    timestamp: raw.timestamp,
  };
  if (raw.edited_timestamp) msg.editedTimestamp = raw.edited_timestamp;
  if (raw.attachments?.length) {
    msg.attachments = raw.attachments.map(normalizeAttachment);
  }
  if (raw.reactions?.length) {
    msg.reactions = raw.reactions.map((r) => ({
      name: r.emoji?.name ?? '?',
      count: r.count,
    }));
  }
  return msg;
}

/**
 * @param {{ channel: string, limit?: number, before?: string, after?: string }} params
 */
export async function readMessages({ channel, limit, before, after }) {
  const resp = await discordGet(`/channels/${channel}/messages`, {
    limit: limit ?? 50,
    before,
    after,
  });
  return { messages: resp.map(normalizeMessage) };
}
