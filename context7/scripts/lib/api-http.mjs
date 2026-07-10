export async function parseErrorResponse(response, settings) {
  let upstreamMessage;
  try {
    const payload = await response.json();
    if (typeof payload?.message === 'string' && payload.message.trim()) {
      upstreamMessage = payload.message.trim();
    }
  } catch {
    // ignore non-JSON bodies
  }
  if (response.status === 429) {
    return {
      kind: 'rate_limit',
      message: settings.apiKey
        ? 'Context7 rate limit exceeded. Retry later or use a higher-limit Context7 plan.'
        : 'Context7 rate limit exceeded. Retry later or configure CONTEXT7_API_KEY for higher limits.',
      upstreamMessage,
    };
  }
  if (response.status === 401) {
    return { kind: 'auth', message: 'Context7 API key appears invalid.', upstreamMessage };
  }
  if (response.status === 404) {
    return {
      kind: 'not_found',
      message: 'No Context7 documentation was found for that library identifier.',
      upstreamMessage,
    };
  }
  return {
    kind: 'unknown',
    message: `Context7 request failed with status ${response.status}.`,
    upstreamMessage,
  };
}

export function buildHeaders(settings) {
  const headers = {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    'X-Context7-Source': 'agents-skill',
  };
  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;
  return headers;
}

export const CONTEXT7_API_BASE_URL = process.env.CONTEXT7_API_URL || 'https://context7.com/api';
