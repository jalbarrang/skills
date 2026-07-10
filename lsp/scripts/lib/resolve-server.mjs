/**
 * Resolve LSP server command/args.
 * Config: loadConfig('lsp') → {command, args}; default npx typescript-language-server when tsconfig found.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './config.mjs';

/** Walk up from startDir looking for fileName; return directory containing it, or null. */
export function findUpFile(startDir, fileName) {
  let dir = path.resolve(startDir);
  const { root } = path.parse(dir);
  while (true) {
    if (fs.existsSync(path.join(dir, fileName))) return dir;
    if (dir === root) return null;
    dir = path.dirname(dir);
  }
}

/**
 * @returns {{ command: string, args: string[], rootPath: string }}
 */
export function resolveServer(filePath) {
  const abs = path.resolve(filePath);
  const fileDir = path.dirname(abs);
  const tsRoot = findUpFile(fileDir, 'tsconfig.json');
  const rootPath = tsRoot || findUpFile(fileDir, 'package.json') || fileDir;

  const cfg = loadConfig('lsp', {});
  if (typeof cfg.command === 'string' && cfg.command.trim()) {
    const args = Array.isArray(cfg.args) ? cfg.args.map(String) : [];
    return { command: cfg.command, args, rootPath };
  }
  if (Array.isArray(cfg.command) && cfg.command.length > 0) {
    return { command: String(cfg.command[0]), args: cfg.command.slice(1).map(String), rootPath };
  }

  if (tsRoot) {
    return {
      command: 'npx',
      args: ['-y', 'typescript-language-server', '--stdio'],
      rootPath: tsRoot,
    };
  }

  return {
    error:
      'No LSP server configured. Add .agents/lsp.json with { "command": "...", "args": [...] }, or place a tsconfig.json so the TypeScript default applies.',
  };
}

export function pathToUri(filePath) {
  const abs = path.resolve(filePath).replace(/\\/g, '/');
  if (/^[A-Za-z]:/.test(abs)) return `file:///${abs[0].toUpperCase()}${abs.slice(1)}`;
  return `file://${abs}`;
}

export function languageIdForFile(filePath) {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  const map = {
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.mts': 'typescript',
    '.cts': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
  };
  return map[ext] ?? 'plaintext';
}
