/** Google Custom Search JSON API. Needs GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID. */
const USER_AGENT = 'browser-skill/1.0';
const TIMEOUT_MS = 15_000;

/**
 * @param {string} query
 * @param {{ GOOGLE_CSE_API_KEY?: string, GOOGLE_CSE_ID?: string }} cfg
 */
export async function searchGoogle(query, cfg) {
  const apiKey = cfg.GOOGLE_CSE_API_KEY;
  const cseId = cfg.GOOGLE_CSE_ID;
  if (!apiKey || !cseId) {
    throw new Error(
      'Google search requires GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in .agents/browser.json (or env via $VAR).',
    );
  }
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', cseId);
  url.searchParams.set('q', query);
  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Google search failed: ${response.status} ${response.statusText}`);
  const json = await response.json();
  return (json.items ?? [])
    .map((item) => ({
      title: item.title ?? '',
      url: item.link ?? '',
      snippet: item.snippet ?? '',
    }))
    .filter((r) => r.title && r.url);
}
