/** Minimal argv flag parser for entry scripts. */
export function parseFlags(argv) {
  const args = argv.slice(2);
  const flags = {};
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') {
      positionals.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        flags[key] = true;
        continue;
      }
      flags[key] = next;
      i++;
      continue;
    }
    positionals.push(a);
  }
  return { flags, positionals };
}

/** Require a string flag value; return undefined if missing. */
export function strFlag(flags, key) {
  const v = flags[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
