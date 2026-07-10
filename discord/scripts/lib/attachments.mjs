/** Download a Discord attachment CDN URL to a temp dir. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { die } from './die.mjs';
import { USER_AGENT, MAX_RETRIES, sleep, retryAfterSeconds } from './http.mjs';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);
const DOWNLOAD_DIR = path.join(os.tmpdir(), 'discord-skill-files');

function filenameFromUrl(url) {
  try {
    const name = path.basename(new URL(url).pathname);
    return name || 'attachment';
  } catch {
    return 'attachment';
  }
}

function isImageFilename(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return false;
  return IMAGE_EXTENSIONS.has(filename.slice(dot + 1).toLowerCase());
}

async function discordDownload(url) {
  let attempt = 0;
  while (true) {
    let response;
    try {
      response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    } catch (err) {
      die(`Download failed: ${err.message}`);
    }
    if (response.status === 429) {
      const retryAfter = await retryAfterSeconds(response);
      if (attempt >= MAX_RETRIES) {
        die(`Download rate limited — retry after ${retryAfter}s (exhausted ${MAX_RETRIES} retries)`);
      }
      await sleep(retryAfter * 1000);
      attempt++;
      continue;
    }
    if (response.status !== 200) die(`Download failed with status ${response.status}`);
    return response.arrayBuffer();
  }
}

/**
 * @param {string} url
 * @returns {Promise<{ url: string, filename: string, localPath: string, isImage: boolean }>}
 */
export async function downloadAttachment(url) {
  try {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  } catch (err) {
    die(`Discord file error [${url}]: Cannot create temp dir: ${err.message}`);
  }

  const buffer = Buffer.from(await discordDownload(url));
  const filename = filenameFromUrl(url);
  const localPath = path.join(DOWNLOAD_DIR, `${Date.now()}-${filename}`);

  try {
    fs.writeFileSync(localPath, buffer);
  } catch (err) {
    die(`Discord file error [${url}]: Write failed: ${err.message}`);
  }

  return { url, filename, localPath, isImage: isImageFilename(filename) };
}
