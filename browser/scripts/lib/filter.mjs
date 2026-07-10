/** Domain allow/block filtering for search results (ported from pi browser-tools). */

export function normalizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function matchesDomain(hostname, domain) {
  const host = hostname.toLowerCase();
  const d = domain.toLowerCase();
  return host === d || host.endsWith(`.${d}`);
}

/**
 * @param {Array<{title:string,url:string,snippet:string}>} results
 * @param {{allow?: string[], block?: string[], limit?: number}} opts
 */
export function filterResults(results, opts = {}) {
  const allow = (opts.allow ?? []).map((d) => d.toLowerCase()).filter(Boolean);
  const block = (opts.block ?? []).map((d) => d.toLowerCase()).filter(Boolean);
  const limit = opts.limit ?? 10;
  const seen = new Set();
  const out = [];

  for (const result of results) {
    const url = normalizeUrl(result.url);
    if (!url || seen.has(url)) continue;
    let hostname;
    try {
      hostname = new URL(url).hostname;
    } catch {
      continue;
    }
    if (block.some((d) => matchesDomain(hostname, d))) continue;
    if (allow.length > 0 && !allow.some((d) => matchesDomain(hostname, d))) continue;
    seen.add(url);
    out.push({
      title: String(result.title ?? '').trim(),
      url,
      snippet: String(result.snippet ?? '').trim(),
    });
    if (out.length >= limit) break;
  }
  return out;
}

export function formatResults(results) {
  if (results.length === 0) return 'No results found.';
  return results
    .map((r, i) => {
      const snip = r.snippet ? `\n   ${r.snippet}` : '';
      return `${i + 1}. [${r.title}](${r.url})${snip}`;
    })
    .join('\n\n');
}
