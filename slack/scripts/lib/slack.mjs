/**
 * Skill-local Slack Web API helpers: fetch, pagination, rate-limit retry, formatting.
 * No dependencies — Node ≥20 global fetch only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.mjs';

const SLACK_BASE_URL = 'https://slack.com/api';
const MAX_RETRIES = 3;
const LARGE_PAYLOAD_BYTES = 4096;
const DOWNLOAD_DIR = path.join(os.tmpdir(), 'slack-skill-files');

const IMAGE_MIMETYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

// ---------------------------------------------------------------------------
// Config / credentials
// ---------------------------------------------------------------------------

export function getSlackConfig() {
  return loadConfig('slack', {
    messageLimit: 50,
    defaultChannel: undefined,
  });
}

export function requireBotToken() {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    fail(
      'Missing SLACK_BOT_TOKEN.\n\nSet this environment variable to a Slack Bot User OAuth Token (xoxb-...) to enable this command.',
    );
  }
  return token;
}

export function requireUserToken() {
  const token = process.env.SLACK_USER_TOKEN;
  if (!token) {
    fail(
      'Missing SLACK_USER_TOKEN.\n\nSearch requires a user token (xoxp-...) with search:read. Set SLACK_USER_TOKEN to enable search.',
    );
  }
  return token;
}

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------

export function fail(message, exitCode = 1) {
  console.error(message);
  process.exit(exitCode);
}

export function usage(lines) {
  fail(`Usage: ${lines.join('\n       ')}`);
}

/**
 * Parse argv into { positionals, flags }.
 * Flags: --name value | --name=value | --bool (true).
 */
export function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
        continue;
      }
      const name = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[name] = next;
        i++;
      } else {
        flags[name] = true;
      }
      continue;
    }
    positionals.push(arg);
  }
  return { positionals, flags };
}

export function scriptPath(metaUrl) {
  return fileURLToPath(metaUrl);
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatApiError(method, code, detail) {
  return `Slack API error [${method}]: ${code}${detail ? ` — ${detail}` : ''}`;
}

/**
 * GET or POST Slack Web API with auth, ok:false mapping, and Retry-After retries.
 */
export async function slackApi(method, { method: httpMethod = 'GET', params, body, token } = {}) {
  if (!token) {
    fail('Slack auth error: token is required but not set');
  }

  let attempt = 0;
  while (true) {
    let url = `${SLACK_BASE_URL}/${method}`;
    /** @type {RequestInit} */
    const init = {
      method: httpMethod,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    if (httpMethod === 'GET') {
      const u = new URL(url);
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== '') {
            u.searchParams.set(key, String(value));
          }
        }
      }
      url = u.toString();
    } else {
      init.headers['Content-Type'] = 'application/json; charset=utf-8';
      init.body = JSON.stringify(body ?? {});
    }

    let response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      fail(`Slack request failed [${method}]: ${err.message}`);
    }

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSec = Number(retryAfterHeader) || 1;
      if (attempt >= MAX_RETRIES) {
        fail(
          `Slack rate limited [${method}] — retry after ${retryAfterSec}s (exhausted ${MAX_RETRIES} retries)`,
        );
      }
      await sleep(retryAfterSec * 1000);
      attempt++;
      continue;
    }

    let json;
    try {
      json = await response.json();
    } catch (err) {
      fail(`Slack API error [${method}]: invalid JSON response (HTTP ${response.status}): ${err.message}`);
    }

    if (!json || typeof json !== 'object') {
      fail(`Slack API error [${method}]: empty or invalid response (HTTP ${response.status})`);
    }

    if (!json.ok) {
      const code = json.error || 'unknown_error';
      const needed = json.needed ? ` (needed scope: ${json.needed})` : '';
      const provided = json.provided ? ` (provided: ${json.provided})` : '';
      fail(formatApiError(method, code, `${needed}${provided}`.trim() || undefined));
    }

    return json;
  }
}

export async function slackGet(method, params, token) {
  return slackApi(method, { method: 'GET', params, token });
}

export async function slackPost(method, body, token) {
  return slackApi(method, { method: 'POST', body, token });
}

export async function slackDownloadUrl(url, token) {
  let attempt = 0;
  while (true) {
    let response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      fail(`Download failed: ${err.message}`);
    }

    if (response.status === 429) {
      const retryAfterSec = Number(response.headers.get('retry-after')) || 1;
      if (attempt >= MAX_RETRIES) {
        fail(`Download rate limited — retry after ${retryAfterSec}s (exhausted ${MAX_RETRIES} retries)`);
      }
      await sleep(retryAfterSec * 1000);
      attempt++;
      continue;
    }

    if (!response.ok) {
      fail(`Download failed with status ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}

// ---------------------------------------------------------------------------
// Domain: channels / messages / search / files
// ---------------------------------------------------------------------------

function normalizeChannel(raw) {
  return {
    id: raw.id,
    name: raw.name,
    isPrivate: Boolean(raw.is_private),
    isMember: Boolean(raw.is_member),
    topic: raw.topic?.value ?? '',
    purpose: raw.purpose?.value ?? '',
    numMembers: raw.num_members ?? 0,
  };
}

function normalizeMessage(raw) {
  const msg = {
    user: raw.user ?? raw.username ?? 'unknown',
    text: raw.text ?? '',
    ts: raw.ts,
  };
  if (raw.thread_ts) msg.threadTs = raw.thread_ts;
  if (raw.reply_count) msg.replyCount = raw.reply_count;
  if (raw.reactions) msg.reactions = raw.reactions;
  if (raw.files) {
    msg.files = raw.files.map((f) => ({
      id: f.id,
      name: f.name,
      mimetype: f.mimetype,
      urlPrivate: f.url_private,
    }));
  }
  return msg;
}

function normalizeFileInfo(raw) {
  const isImage = IMAGE_MIMETYPES.has(raw.mimetype);
  const info = {
    id: raw.id,
    name: raw.name,
    title: raw.title,
    mimetype: raw.mimetype,
    filetype: raw.filetype,
    size: raw.size,
    urlPrivate: raw.url_private,
    permalink: raw.permalink,
    isImage,
  };
  if (isImage && raw.original_w) info.imageWidth = raw.original_w;
  if (isImage && raw.original_h) info.imageHeight = raw.original_h;
  return info;
}

export async function listChannels({ limit, cursor, types } = {}) {
  const token = requireBotToken();
  const resp = await slackGet(
    'conversations.list',
    {
      limit: limit ?? 100,
      cursor,
      types: types ?? 'public_channel,private_channel',
      exclude_archived: true,
    },
    token,
  );
  const next = resp.response_metadata?.next_cursor || undefined;
  return {
    channels: (resp.channels ?? []).map(normalizeChannel),
    cursor: next || undefined,
  };
}

export async function readMessages({ channel, limit, oldest, latest, cursor } = {}) {
  const token = requireBotToken();
  const config = getSlackConfig();
  const resp = await slackGet(
    'conversations.history',
    {
      channel,
      limit: limit ?? config.messageLimit ?? 50,
      oldest,
      latest,
      cursor,
    },
    token,
  );
  const next = resp.response_metadata?.next_cursor || undefined;
  return {
    messages: (resp.messages ?? []).map(normalizeMessage),
    hasMore: Boolean(resp.has_more),
    cursor: next || undefined,
  };
}

export async function readThread({ channel, threadTs, limit, cursor } = {}) {
  const token = requireBotToken();
  const resp = await slackGet(
    'conversations.replies',
    {
      channel,
      ts: threadTs,
      limit: limit ?? 100,
      cursor,
    },
    token,
  );
  const next = resp.response_metadata?.next_cursor || undefined;
  return {
    messages: (resp.messages ?? []).map(normalizeMessage),
    hasMore: Boolean(resp.has_more),
    cursor: next || undefined,
  };
}

export async function searchMessages({ query, count, sort, sortDir, cursor } = {}) {
  const token = requireUserToken();
  const resp = await slackGet(
    'search.messages',
    {
      query,
      count: count ?? 20,
      sort: sort ?? 'timestamp',
      sort_dir: sortDir ?? 'desc',
      cursor,
    },
    token,
  );
  const messages = resp.messages ?? {};
  return {
    matches: (messages.matches ?? []).map((m) => ({
      channel: m.channel,
      user: m.username ?? m.user ?? 'unknown',
      text: m.text,
      ts: m.ts,
      permalink: m.permalink,
    })),
    total: messages.total ?? 0,
    cursor: messages.pagination?.next_cursor || undefined,
  };
}

export async function downloadFile(fileId) {
  const token = requireBotToken();
  const infoResp = await slackGet('files.info', { file: fileId }, token);
  const info = normalizeFileInfo(infoResp.file);

  try {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  } catch (err) {
    fail(`Slack file error [${fileId}]: Cannot create temp dir: ${err.message}`);
  }

  const buffer = await slackDownloadUrl(info.urlPrivate, token);
  const ext = info.name.includes('.') ? '' : `.${info.filetype}`;
  const filename = `${info.id}-${info.name}${ext}`;
  const localPath = path.join(DOWNLOAD_DIR, filename);

  try {
    fs.writeFileSync(localPath, buffer);
  } catch (err) {
    fail(`Slack file error [${fileId}]: Write failed: ${err.message}`);
  }

  return { info, localPath };
}

export async function postMessage({ channel, text, threadTs, replyBroadcast } = {}) {
  const token = requireBotToken();
  const body = { channel, text };
  if (threadTs !== undefined) body.thread_ts = threadTs;
  if (replyBroadcast !== undefined) body.reply_broadcast = replyBroadcast;
  const resp = await slackPost('chat.postMessage', body, token);
  return { ts: resp.ts, channel: resp.channel };
}

export async function editMessage({ channel, ts, text } = {}) {
  const token = requireBotToken();
  const resp = await slackPost('chat.update', { channel, ts, text }, token);
  return { ts: resp.ts, channel: resp.channel };
}

export async function deleteMessage({ channel, ts } = {}) {
  const token = requireBotToken();
  const resp = await slackPost('chat.delete', { channel, ts }, token);
  return { ts: resp.ts, channel: resp.channel };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatTimestamp(ts) {
  const date = new Date(Number(ts) * 1000);
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSingleMessage(msg) {
  const time = formatTimestamp(msg.ts);
  const thread = msg.replyCount ? ` [${msg.replyCount} replies]` : '';
  const reactions = msg.reactions
    ? ` ${msg.reactions.map((r) => `:${r.name}: ${r.count}`).join(' ')}`
    : '';
  const files = msg.files
    ? `\n  📎 ${msg.files.map((f) => `${f.name} (${f.id})`).join(', ')}`
    : '';
  return `[${time}] **${msg.user}**${thread}: ${msg.text}${reactions}${files}`;
}

function cursorFooter(cursor, hasMore) {
  if (!cursor) return '';
  const more = hasMore ? ' (more available)' : '';
  return `\n\nNext cursor${more}: ${cursor}`;
}

export function formatChannelList(channels, cursor) {
  if (channels.length === 0) return 'No channels found.';
  const lines = channels.map((ch) => {
    const visibility = ch.isPrivate ? '🔒' : '#';
    const members = `${ch.numMembers} members`;
    const topic = ch.topic ? ` — ${ch.topic}` : '';
    return `${visibility} **${ch.name}** (${ch.id}) · ${members}${topic}`;
  });
  return `**Channels** (${channels.length}):\n\n${lines.join('\n')}${cursorFooter(cursor)}`;
}

export function formatMessages(result, channelId) {
  if (result.messages.length === 0) return `No messages found in channel ${channelId}.`;
  const header = `**Messages** in ${channelId} (${result.messages.length}${result.hasMore ? ', more available' : ''}):`;
  const msgs = result.messages.map(formatSingleMessage);
  return `${header}\n\n${msgs.join('\n\n')}${cursorFooter(result.cursor, result.hasMore)}`;
}

export function formatThread(result, channelId, threadTs) {
  if (result.messages.length === 0) return `No replies found in thread ${threadTs}.`;
  const header = `**Thread** ${threadTs} in ${channelId} (${result.messages.length} messages${result.hasMore ? ', more available' : ''}):`;
  const msgs = result.messages.map(formatSingleMessage);
  return `${header}\n\n${msgs.join('\n\n')}${cursorFooter(result.cursor, result.hasMore)}`;
}

export function formatSearchResults(result, query) {
  if (result.matches.length === 0) return `No results found for "${query}".`;
  const header = `**Search results** for "${query}" (${result.matches.length} of ${result.total} total):`;
  const matches = result.matches.map((m) => {
    const time = formatTimestamp(m.ts);
    const channelName = m.channel?.name ?? m.channel?.id ?? 'unknown';
    return `[${time}] **${m.user}** in #${channelName}: ${m.text}\n  🔗 ${m.permalink}`;
  });
  return `${header}\n\n${matches.join('\n\n')}${cursorFooter(result.cursor)}`;
}

export function formatPostedMessage(result, threadTs) {
  const where = threadTs ? `thread ${threadTs} in ${result.channel}` : `${result.channel}`;
  return `✅ Message posted to ${where} (ts: ${result.ts})`;
}

export function formatEditedMessage(result) {
  return `✏️ Message edited in ${result.channel} (ts: ${result.ts})`;
}

export function formatDeletedMessage(result) {
  return `🗑️ Message deleted in ${result.channel} (ts: ${result.ts})`;
}

export function formatFileInfo(info) {
  const size = formatFileSize(info.size);
  const dims = info.isImage && info.imageWidth ? ` · ${info.imageWidth}×${info.imageHeight}` : '';
  return `📎 **${info.title}** (${info.name})\n  Type: ${info.mimetype} · Size: ${size}${dims}\n  ID: ${info.id}\n  🔗 ${info.permalink}`;
}

export function formatDownloadedFile(result) {
  const info = formatFileInfo(result.info);
  const hint = result.info.isImage
    ? `\n\n💡 This is an image file. Use the \`read\` tool to view it:\n  \`read ${result.localPath}\``
    : `\n\n📁 Downloaded to: ${result.localPath}`;
  return `${info}${hint}`;
}

/**
 * Print digest; if payload JSON is large, also write full JSON to a temp file and print the path.
 */
export function emitOutput(digest, payload) {
  console.log(digest);
  if (payload === undefined) return;
  let json;
  try {
    json = JSON.stringify(payload, null, 2);
  } catch {
    return;
  }
  if (Buffer.byteLength(json, 'utf8') < LARGE_PAYLOAD_BYTES) return;
  const outPath = path.join(
    os.tmpdir(),
    `slack-skill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`,
  );
  try {
    fs.writeFileSync(outPath, json);
    console.log(`\nFull JSON: ${outPath}`);
  } catch (err) {
    console.error(`warning: could not write full JSON payload: ${err.message}`);
  }
}

/**
 * Wrap a script main so uncaught errors become actionable stderr + exit 1.
 */
export async function runMain(main) {
  try {
    await main();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exit(1);
  }
}
