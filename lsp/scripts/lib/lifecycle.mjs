/**
 * LSP lifecycle: spawn → initialize → didOpen → shutdown/exit.
 * Ground truth: pi-extensions/packages/lsp client.ts (slimmed to one-shot use).
 */
import fs from 'node:fs';
import path from 'node:path';
import { LspConnection } from './framing.mjs';
import { languageIdForFile, pathToUri } from './resolve-server.mjs';

export class LspSession {
  #conn;
  #rootPath;
  #diagnostics = new Map();
  #diagWaiters = new Map();

  constructor(command, args, rootPath) {
    this.#rootPath = rootPath;
    this.#conn = new LspConnection(command, args, { cwd: rootPath });
    this.#conn.setNotificationHandler((method, params) => {
      if (method !== 'textDocument/publishDiagnostics') return;
      const { uri, diagnostics } = params;
      this.#diagnostics.set(uri, diagnostics ?? []);
      const waiter = this.#diagWaiters.get(uri);
      if (waiter && diagnostics?.length > 0) {
        waiter.resolve();
        this.#diagWaiters.delete(uri);
      }
    });
  }

  async start() {
    this.#conn.spawn();
    const rootUri = pathToUri(this.#rootPath);
    await this.#conn.sendRequest('initialize', {
      processId: process.pid,
      rootUri,
      rootPath: this.#rootPath,
      capabilities: {
        textDocument: {
          publishDiagnostics: { relatedInformation: true },
          hover: { contentFormat: ['markdown', 'plaintext'] },
          definition: {},
          references: {},
          documentSymbol: { hierarchicalDocumentSymbolSupport: true },
          synchronization: { didSave: true },
        },
        workspace: { workspaceFolders: true },
      },
      workspaceFolders: [{ uri: rootUri, name: path.basename(this.#rootPath) || 'workspace' }],
    });
    this.#conn.sendNotification('initialized', {});
  }

  async openFile(filePath) {
    const abs = path.resolve(filePath);
    const uri = pathToUri(abs);
    const text = fs.readFileSync(abs, 'utf8');
    this.#conn.sendNotification('textDocument/didOpen', {
      textDocument: { uri, languageId: languageIdForFile(abs), version: 1, text },
    });
    this.#conn.sendNotification('textDocument/didSave', { textDocument: { uri }, text });
    return uri;
  }

  request(method, params, timeoutMs) {
    return this.#conn.sendRequest(method, params, timeoutMs);
  }

  getDiagnostics(uri) {
    return this.#diagnostics.get(uri) ?? [];
  }

  waitForDiagnostics(uri, timeoutMs = 15_000) {
    if ((this.#diagnostics.get(uri) || []).length > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(() => { this.#diagWaiters.delete(uri); resolve(); }, timeoutMs);
      this.#diagWaiters.set(uri, { resolve: () => { clearTimeout(timer); resolve(); } });
    });
  }

  async shutdown() {
    try {
      if (this.#conn.alive) {
        await this.#conn.sendRequest('shutdown', null, 5_000);
        this.#conn.sendNotification('exit', null);
      }
    } catch { /* best-effort */ }
    this.#conn.dispose();
  }
}
