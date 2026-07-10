#!/usr/bin/env node
/**
 * One-shot LSP query.
 * Usage: node query.mjs --op <diagnostics|hover|definitions|references|symbols>
 *   --file <path> [--line N --col N]
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, runMain, usage } from './lib/cli.mjs';
import { LspSession } from './lib/lifecycle.mjs';
import { runOp } from './lib/ops.mjs';
import { resolveServer } from './lib/resolve-server.mjs';

const OPS = new Set(['diagnostics', 'hover', 'definitions', 'references', 'symbols']);
const USAGE = `Usage: node query.mjs --op <diagnostics|hover|definitions|references|symbols> --file <path> [--line N --col N]
  --line/--col are 1-based and required for hover, definitions, references.
  Prefer harness-native LSP (e.g. Cursor) when available; this script accepts cold-start latency.`;

runMain(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  if (flags.help || flags.h) usage(USAGE);

  const op = String(flags.op || '');
  const file = flags.file;
  if (!OPS.has(op)) usage(USAGE);
  if (!file || file === true) usage(USAGE);

  const needsPos = op === 'hover' || op === 'definitions' || op === 'references';
  if (needsPos) {
    const line = Number(flags.line);
    const col = Number(flags.col ?? flags.column);
    if (!Number.isInteger(line) || line < 1) {
      usage(`--line N is required for --op ${op} (1-based)\n${USAGE}`);
    }
    if (!Number.isInteger(col) || col < 1) {
      usage(`--col N is required for --op ${op} (1-based)\n${USAGE}`);
    }
  }

  const filePath = path.resolve(String(file));
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const server = resolveServer(filePath);
  if (server.error) throw new Error(server.error);

  const session = new LspSession(server.command, server.args, server.rootPath);
  try {
    await session.start();
    console.log(await runOp(session, op, filePath, flags));
  } finally {
    await session.shutdown();
  }
});
