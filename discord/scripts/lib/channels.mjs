/** List text-like channels in a guild. */
import { discordGet } from './api.mjs';

/** Text, announcement, threads, forum. */
const TEXT_CHANNEL_TYPES = new Set([0, 5, 10, 11, 12, 15]);

function normalizeChannel(raw) {
  const channel = {
    id: raw.id,
    name: raw.name ?? '(unnamed)',
    type: raw.type,
    topic: raw.topic ?? '',
  };
  if (raw.parent_id) channel.parentId = raw.parent_id;
  return channel;
}

/**
 * @param {{ guild: string }} params
 * @returns {Promise<{ channels: Array<{ id: string, name: string, type: number, topic: string, parentId?: string }> }>}
 */
export async function listChannels({ guild }) {
  const resp = await discordGet(`/guilds/${guild}/channels`, {});
  return {
    channels: resp.filter((c) => TEXT_CHANNEL_TYPES.has(c.type)).map(normalizeChannel),
  };
}
