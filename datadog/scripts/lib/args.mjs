/**
 * Shared CLI arg parsing for logs.mjs / rum.mjs.
 */

export function fail(message) {
  console.error(message);
  process.exit(1);
}

export function usage(kind) {
  const extra = kind === 'rum' ? ' [--application-id <id>]' : '';
  fail(
    `Usage: node ${kind}.mjs --query <q> [--from <time>] [--to <time>] [--limit <n>] [--sort newest|oldest] [--service <s>] [--env <e>]${extra}\n` +
      '  Set DD_DRY_RUN=1 to print the would-be request (URL + JSON body) without fetching.',
  );
}

/**
 * @param {string[]} argv process.argv
 * @param {'logs'|'rum'} kind
 */
export function parseSearchArgs(argv, kind) {
  const args = argv.slice(2);
  const out = { query: undefined, from: undefined, to: undefined, limit: undefined, sort: undefined, service: undefined, env: undefined, applicationId: undefined };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = () => {
      const v = args[++i];
      if (v === undefined || v.startsWith('-')) usage(kind);
      return v;
    };
    if (a === '--query') out.query = next();
    else if (a === '--from') out.from = next();
    else if (a === '--to') out.to = next();
    else if (a === '--limit') {
      const raw = next();
      if (!/^\d+$/.test(raw)) usage(kind);
      out.limit = Number(raw);
      if (out.limit < 1 || out.limit > 100) usage(kind);
    } else if (a === '--sort') {
      out.sort = next();
      if (out.sort !== 'newest' && out.sort !== 'oldest') usage(kind);
    } else if (a === '--service') out.service = next();
    else if (a === '--env') out.env = next();
    else if (a === '--application-id' && kind === 'rum') out.applicationId = next();
    else usage(kind);
  }
  if (out.query === undefined) usage(kind);
  return out;
}
