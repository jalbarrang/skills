/** Minimal argv flag parser for entry scripts. */
export function parseFlags(argv, { positional = 0 } = {}) {
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
  if (positional > 0 && positionals.length < positional) {
    return { flags, positionals, ok: false };
  }
  return { flags, positionals, ok: true };
}
