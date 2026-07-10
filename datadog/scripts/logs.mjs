#!/usr/bin/env node
/**
 * logs.mjs --query <q> [--from <time>] [--to <time>] [--limit <n>]
 * Search Datadog logs; digest on stdout; full JSON events in a temp file.
 */
import { parseSearchArgs } from './lib/args.mjs';
import { searchLogs } from './lib/api.mjs';
import { loadDotEnv, requireCredentials, getDatadogConfig } from './lib/env.mjs';
import { formatLogsDigest, normalizeLog } from './lib/format.mjs';
import { writeTempJson } from './lib/output.mjs';

async function main() {
  loadDotEnv();
  const params = parseSearchArgs(process.argv, 'logs');
  const credentials = requireCredentials();
  const config = getDatadogConfig();

  const { fullQuery, fromIso, toIso, json } = await searchLogs(params, config, credentials);
  if (json?.dryRun) return;

  const logs = (json?.data ?? []).map(normalizeLog);
  const result = {
    logs,
    totalCount: logs.length,
    query: fullQuery,
    from: fromIso,
    to: toIso,
    raw: json,
  };

  let file;
  if (logs.length > 0) {
    try {
      file = writeTempJson(result, 'logs');
    } catch {
      file = undefined;
    }
  }
  console.log(formatLogsDigest(result, file));
}

main().catch((err) => {
  console.error(err?.message || String(err));
  process.exit(1);
});
