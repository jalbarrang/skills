/** Shared Discord HTTP constants and 429 backoff helpers. */
export const DISCORD_BASE_URL = 'https://discord.com/api/v10';
export const USER_AGENT = 'DiscordBot (https://github.com/jalbarrang/skills, 0.1.0)';
export const MAX_RETRIES = 3;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parse retry_after seconds from 429 JSON body, else Retry-After header. */
export async function retryAfterSeconds(response) {
  try {
    const body = await response.clone().json();
    if (typeof body?.retry_after === 'number' && body.retry_after > 0) {
      return body.retry_after;
    }
  } catch {
    // non-JSON body
  }
  const header = Number(response.headers.get('retry-after'));
  return Number.isFinite(header) && header > 0 ? header : 1;
}
