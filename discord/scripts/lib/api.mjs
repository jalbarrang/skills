/**
 * Discord REST v10 GET via global fetch.
 * Auth: Authorization: Bot $DISCORD_BOT_TOKEN. Bounded 429 retries via retry_after.
 */
import { die } from './die.mjs';
import { requireBotToken } from './cli.mjs';
import {
  DISCORD_BASE_URL,
  USER_AGENT,
  MAX_RETRIES,
  sleep,
  retryAfterSeconds,
} from './http.mjs';

/**
 * GET a Discord REST route. Returns parsed JSON. Exits on auth/API errors.
 * @param {string} route e.g. `/guilds/{id}/channels`
 * @param {Record<string, string|number|boolean|undefined>} [params]
 */
export async function discordGet(route, params = {}) {
  const token = requireBotToken();
  const url = new URL(`${DISCORD_BASE_URL}${route}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  let attempt = 0;
  while (true) {
    let response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bot ${token}`,
          'User-Agent': USER_AGENT,
        },
      });
    } catch (err) {
      die(`Discord request failed [${route}]: ${err.message}`);
    }

    if (response.status === 429) {
      const retryAfter = await retryAfterSeconds(response);
      if (attempt >= MAX_RETRIES) {
        die(`Discord rate limited [${route}] — retry after ${retryAfter}s (exhausted ${MAX_RETRIES} retries)`);
      }
      await sleep(retryAfter * 1000);
      attempt++;
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      let detail = '';
      let code;
      try {
        const body = await response.json();
        if (body?.message) detail = ` — ${body.message}`;
        if (body?.code !== undefined) code = body.code;
      } catch {
        // ignore
      }
      const codePart = code !== undefined ? ` (code ${code})` : '';
      die(`Discord API error [${route}]: HTTP ${response.status}${codePart}${detail}`);
    }

    try {
      return await response.json();
    } catch (err) {
      die(`Discord API error [${route}]: invalid JSON (HTTP ${response.status}): ${err.message}`);
    }
  }
}
