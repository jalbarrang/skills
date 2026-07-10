/** Discover lens markdown files and select applicable ones. */
import fs from 'node:fs';
import path from 'node:path';

/** Read all `*.md` lenses from lensDir. Missing dir → empty map. */
export function discoverLenses(lensDir) {
  const lenses = new Map();
  let entries;
  try {
    entries = fs.readdirSync(lensDir);
  } catch {
    return lenses;
  }
  for (const file of entries.filter((f) => f.endsWith('.md'))) {
    const full = path.join(lensDir, file);
    try {
      const content = fs.readFileSync(full, 'utf8');
      const key = path.basename(file, '.md');
      lenses.set(key, { name: key, path: full, content });
    } catch {
      // skip unreadable
    }
  }
  return lenses;
}

/**
 * Resolve which lenses apply: explicit names → defaultLenses → all available.
 * Mirrors pi extension resolveLensNames.
 */
export function resolveLensNames(requested, defaults, available) {
  if (requested.length > 0) {
    return requested.filter((n) => available.has(n));
  }
  if (defaults.length > 0) {
    return defaults.filter((n) => available.has(n));
  }
  return [...available.keys()];
}

/** Concatenate applicable lens markdown with clear separators. */
export function concatLensInstructions(names, available) {
  const parts = [];
  for (const name of names) {
    const lens = available.get(name);
    if (!lens) continue;
    parts.push(`### Lens: ${lens.name}`, '', lens.content.trim(), '');
  }
  return parts.join('\n').trimEnd();
}
