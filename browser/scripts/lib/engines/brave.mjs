/** Brave Search API. Needs BRAVE_SEARCH_API_KEY. */
const USER_AGENT = 'browser-skill/1.0';
const TIMEOUT_MS = 15_000;

/**
 * @param {string} query
 * @param {{ BRAVE_SEARCH_API_KEY?: string }} cfg
 */
export async function searchBrave(query, cfg) {
  const apiKey = cfg.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Brave search requires BRAVE_SEARCH_API_KEY in .agents/browser.json (or env via $VAR).',
    );
  }
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'user-agent': USER_AGENT,
      accept: 'application/json',
      'x-subscription-token': apiKey,
    },
  });
  if (!response.ok) throw new Error(`Brave search failed: ${response.status} ${response.statusText}`);
  const json = await response.json();
  return (json.web?.results ?? [])
    .map((item) => ({
      title: item.title ?? '',
      url: item.url ?? '',
      snippet: item.description ?? '',
    }))
    .filter((r) => r.title && r.url);
}
