#!/usr/bin/env node
/**
 * Discover project review lenses and print their instructions.
 * Usage: node lenses.mjs [--lens name[,name...]]
 * Discovery: `.code-review.json` → lensDir (default `.code-review/lenses`) → `*.md`.
 */
import { parseArgs, runMain } from './lib/cli.mjs';
import { getLensDir, loadReviewConfig, NO_LENSES_EXAMPLE } from './lib/lenses-config.mjs';
import { concatLensInstructions, discoverLenses, resolveLensNames } from './lib/lenses-discover.mjs';

runMain(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const config = loadReviewConfig(cwd);
  const lensDir = getLensDir(cwd, config);
  const available = discoverLenses(lensDir);

  if (available.size === 0) {
    console.log(NO_LENSES_EXAMPLE);
    process.exit(0);
  }

  const requested =
    flags.lens === true || flags.lens === undefined
      ? []
      : String(flags.lens)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

  const names = resolveLensNames(requested, config.defaultLenses, available);
  if (names.length === 0) {
    console.log(
      `No applicable lenses (available: ${[...available.keys()].join(', ') || 'none'}).`,
    );
    process.exit(0);
  }

  console.log(`# Applicable lenses (${names.join(', ')})\n`);
  console.log(concatLensInstructions(names, available));
});
