/** Load `.code-review.json` the way the pi code-reviewer extension does. */
import fs from 'node:fs';
import path from 'node:path';

export const CONFIG_FILE = '.code-review.json';
export const DEFAULT_LENS_DIR = '.code-review/lenses';

export function defaultConfig() {
  return { lensDir: DEFAULT_LENS_DIR, defaultLenses: [] };
}

/** Read project `.code-review.json` from cwd. Missing/malformed → defaults. */
export function loadReviewConfig(cwd = process.cwd()) {
  const configPath = path.resolve(cwd, CONFIG_FILE);
  if (!fs.existsSync(configPath)) return { ...defaultConfig(), configPath, present: false };
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return {
      lensDir: typeof raw.lensDir === 'string' && raw.lensDir.trim() ? raw.lensDir.trim() : DEFAULT_LENS_DIR,
      defaultLenses: Array.isArray(raw.defaultLenses)
        ? raw.defaultLenses.filter((n) => typeof n === 'string')
        : [],
      configPath,
      present: true,
    };
  } catch {
    console.error(`lenses: malformed JSON in ${configPath}, using defaults`);
    return { ...defaultConfig(), configPath, present: false };
  }
}

export function getLensDir(cwd, config) {
  return path.resolve(cwd, config.lensDir);
}

export const NO_LENSES_EXAMPLE = `No lenses configured.

Create \`.code-review.json\` and lens markdown under \`.code-review/lenses/\`:

\`\`\`json
{
  "lensDir": ".code-review/lenses",
  "defaultLenses": ["code-quality"]
}
\`\`\`

Example lens (\`.code-review/lenses/code-quality.md\`):

\`\`\`md
# Code Quality

Catch correctness and reliability bugs in the diff.

## Criteria
- Logic errors, null-safety, error-handling gaps
- Security and concurrency hazards

## Severity
- blocker: Will cause a production incident or data loss
- warning: Likely bug under realistic conditions
- note: Smell worth fixing but not urgent
\`\`\`
`;
