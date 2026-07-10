/** DuckDuckGo HTML search — no API key. */
import { attr, stripTags } from '../html.mjs';

const USER_AGENT = 'browser-skill/1.0';
const TIMEOUT_MS = 15_000;

function decodeDuckDuckGoUrl(href) {
  try {
    const url = new URL(href, 'https://html.duckduckgo.com');
    const uddg = url.searchParams.get('uddg');
    if (uddg) return decodeURIComponent(uddg);
    return url.toString();
  } catch {
    return null;
  }
}

export async function searchDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' },
  });
  if (!response.ok) throw new Error(`DuckDuckGo search failed: ${response.status} ${response.statusText}`);
  const html = await response.text();
  const blocks = html.split(/class="[^"]*\bresult\b[^"]*results_links[^"]*"/i).slice(1);
  const results = [];
  for (const block of blocks) {
    const a = block.match(/<a\b([^>]*class="[^"]*result__a[^"]*"[^>]*)>([\s\S]*?)<\/a>/i);
    if (!a) continue;
    const title = stripTags(a[2]);
    const href = attr(a[1], 'href');
    const decoded = decodeDuckDuckGoUrl(href) ?? href;
    const snip = block.match(/class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    if (!title || !decoded) continue;
    results.push({ title, url: decoded, snippet: snip ? stripTags(snip[1]) : '' });
  }
  return results;
}
