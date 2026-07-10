/**
 * JSON-RPC over stdio with LSP Content-Length framing.
 * Ground truth: pi-extensions/packages/lsp protocol.ts (slimmed).
 */
import { spawn } from 'node:child_process';
export class LspConnection {
  #proc = null;
  #buf = Buffer.alloc(0);
  #nextId = 1;
  #pending = new Map();
  #onNotification = () => {};
  #disposed = false;
  constructor(command, args, { cwd } = {}) {
    Object.assign(this, { command, args, cwd });
  }
  spawn() {
    if (this.#proc) return;
    this.#proc = spawn(this.command, this.args, {
      stdio: ['pipe', 'pipe', 'pipe'], cwd: this.cwd, env: process.env,
      shell: process.platform === 'win32',
    });
    this.#proc.stdout.on('data', (c) => {
      this.#buf = Buffer.concat([this.#buf, c]);
      this.#drain();
    });
    this.#proc.on('exit', () => this.#rejectAll('Server process exited'));
    this.#proc.on('error', (e) => this.#rejectAll(`Server process error: ${e.message}`));
  }
  get alive() {
    return this.#proc !== null && !this.#disposed && this.#proc.exitCode === null;
  }
  setNotificationHandler(h) { this.#onNotification = h; }
  sendRequest(method, params, timeoutMs = 30_000) {
    if (!this.alive) return Promise.reject(new Error('Connection not alive'));
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`LSP '${method}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.#pending.set(id, { resolve, reject, timer });
      this.#write({ jsonrpc: '2.0', id, method, params });
    });
  }
  sendNotification(method, params) {
    if (this.alive) this.#write({ jsonrpc: '2.0', method, params });
  }
  dispose() {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#rejectAll('Connection disposed');
    this.#proc?.stdin?.end();
    this.#proc?.kill();
    this.#proc = null;
  }
  #write(message) {
    const body = JSON.stringify(message);
    this.#proc?.stdin?.write(`Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`);
  }
  #drain() {
    const D = '\r\n\r\n';
    while (true) {
      const end = this.#buf.indexOf(D);
      if (end === -1) break;
      const m = this.#buf.subarray(0, end).toString('ascii').match(/Content-Length:\s*(\d+)/i);
      if (!m) { this.#buf = this.#buf.subarray(end + D.length); continue; }
      const len = Number(m[1]);
      const start = end + D.length;
      if (this.#buf.length < start + len) break;
      const raw = this.#buf.subarray(start, start + len).toString('utf8');
      this.#buf = this.#buf.subarray(start + len);
      try { this.#handle(JSON.parse(raw)); } catch { /* skip */ }
    }
  }
  #handle(msg) {
    if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
      const p = this.#pending.get(msg.id);
      if (!p) return;
      clearTimeout(p.timer);
      this.#pending.delete(msg.id);
      if (msg.error) p.reject(new Error(`LSP error ${msg.error.code}: ${msg.error.message}`));
      else p.resolve(msg.result);
      return;
    }
    if (typeof msg.method === 'string' && msg.id === undefined) this.#onNotification(msg.method, msg.params);
    else if (typeof msg.method === 'string') this.#write({ jsonrpc: '2.0', id: msg.id, result: null });
  }
  #rejectAll(reason) {
    for (const [, p] of this.#pending) { clearTimeout(p.timer); p.reject(new Error(reason)); }
    this.#pending.clear();
  }
}
