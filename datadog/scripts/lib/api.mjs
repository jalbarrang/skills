/**
 * Datadog REST search via global fetch.
 * POST https://api.<site>/api/v2/logs/events/search
 * POST https://api.<site>/api/v2/rum/events/search
 * Headers: DD-API-KEY, DD-APPLICATION-KEY
 *
 * DD_DRY_RUN=1 prints URL + JSON body and skips the network call.
 */
import { resolveTime } from './time.mjs';
import { buildQuery, buildRumQuery } from './query.mjs';

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

/** Build POST body matching extension filterQuery/from/to/pageLimit/sort. */
export function buildSearchBody({ query, fromIso, toIso, limit, sort }) {
  return {
    filter: { query, from: fromIso, to: toIso },
    page: { limit },
    sort: sort === 'oldest' ? 'timestamp' : '-timestamp',
  };
}

function resolveWindow(params, config) {
  const fromRes = resolveTime(params.from ?? config.defaultTimeRange);
  if (!fromRes.ok) fail(fromRes.error);
  const toRes = resolveTime(params.to ?? 'now');
  if (!toRes.ok) fail(toRes.error);
  return {
    fromIso: fromRes.date.toISOString(),
    toIso: toRes.date.toISOString(),
    limit: Math.min(params.limit ?? 25, 100),
  };
}

async function postSearch(url, body, credentials) {
  if (process.env.DD_DRY_RUN === '1') {
    console.log(`DRY_RUN ${url}`);
    console.log(JSON.stringify(body, null, 2));
    return { dryRun: true };
  }
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'DD-API-KEY': credentials.apiKey,
        'DD-APPLICATION-KEY': credentials.appKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    fail(`Datadog request failed: ${err?.message || String(err)}`);
  }
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    fail(`Datadog API error (${res.status}): non-JSON response`);
  }
  if (!res.ok) {
    const detail = Array.isArray(json.errors) ? json.errors.join('; ') : text.slice(0, 200);
    if (res.status === 401 || res.status === 403) {
      fail(`Datadog auth error (${res.status})${detail ? `: ${detail}` : ''}. Check DD_API_KEY / DD_APP_KEY.`);
    }
    fail(`Datadog API error (${res.status})${detail ? `: ${detail}` : ''}.`);
  }
  return json;
}

export async function searchLogs(params, config, credentials) {
  const fullQuery = buildQuery(params, config);
  const { fromIso, toIso, limit } = resolveWindow(params, config);
  const body = buildSearchBody({ query: fullQuery, fromIso, toIso, limit, sort: params.sort });
  const url = `https://api.${config.site}/api/v2/logs/events/search`;
  const json = await postSearch(url, body, credentials);
  return { fullQuery, fromIso, toIso, limit, body, url, json };
}

export async function searchRum(params, config, credentials) {
  const fullQuery = buildRumQuery(params, config);
  const { fromIso, toIso, limit } = resolveWindow(params, config);
  const body = buildSearchBody({ query: fullQuery, fromIso, toIso, limit, sort: params.sort });
  const url = `https://api.${config.site}/api/v2/rum/events/search`;
  const json = await postSearch(url, body, credentials);
  return { fullQuery, fromIso, toIso, limit, body, url, json };
}
