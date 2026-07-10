#!/usr/bin/env node
/**
 * rum.mjs --query <q> [--from <time>] [--to <time>] [--limit <n>]
 * Search Datadog RUM events; digest on stdout; full JSON events in a temp file.
 */
import { parseSearchArgs } from './lib/args.mjs';
import { searchRum } from './lib/api.mjs';
import { loadDotEnv, requireCredentials, getDatadogConfig } from './lib/env.mjs';
import { writeTempJson } from './lib/output.mjs';
import { formatRumDigest, normalizeRum } from './lib/rum-format.mjs';

async function main() {
  loadDotEnv();
  const params = parseSearchArgs(process.argv, 'rum');
  const credentials = requireCredentials();
  const config = getDatadogConfig();

  const { fullQuery, fromIso, toIso, json } = await searchRum(params, config, credentials);
  if (json?.dryRun) return;

  const events = (json?.data ?? []).map(normalizeRum);
  const result = {
    events,
    totalCount: events.length,
    query: fullQuery,
    from: fromIso,
    to: toIso,
    raw: json,
  };

  let file;
  if (events.length > 0) {
    try {
      file = writeTempJson(result, 'rum');
    } catch {
      file = undefined;
    }
  }
  console.log(formatRumDigest(result, file));
}

main().catch((err) => {
  console.error(err?.message || String(err));
  process.exit(1);
});
