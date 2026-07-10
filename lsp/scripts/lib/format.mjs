/** Format LSP results for readable stdout. */
const SEV = { 1: 'ERROR', 2: 'WARN', 3: 'INFO', 4: 'HINT' };
const KINDS = {
  5: 'class', 6: 'method', 7: 'property', 9: 'constructor', 10: 'enum',
  11: 'interface', 12: 'function', 13: 'variable', 14: 'constant',
};

function loc(range) {
  const s = range.start;
  return `line ${s.line + 1}:${s.character + 1}`;
}

export function formatDiagnostics(filePath, diagnostics) {
  if (!diagnostics.length) return `${filePath}: No diagnostics — all clean`;
  const lines = [`Diagnostics for ${filePath}: ${diagnostics.length}`];
  diagnostics.forEach((d, i) => {
    lines.push(`${i + 1}. ${SEV[d.severity] || 'UNKNOWN'} ${loc(d.range)}`);
    lines.push(`   ${d.message}`);
  });
  return lines.join('\n');
}

export function formatHover(hover, filePath, line, col) {
  const pos = `${filePath}:${line}:${col}`;
  if (!hover) return `No hover information at ${pos}`;
  const c = hover.contents;
  let text;
  if (typeof c === 'string') text = c;
  else if (Array.isArray(c)) {
    text = c.map((x) => (typeof x === 'string' ? x : x.value)).join('\n\n');
  } else if (c && typeof c === 'object' && 'value' in c) text = c.value;
  else text = JSON.stringify(c);
  return `Hover at ${pos}:\n\n${text}`;
}

function normalizeLocations(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (typeof result === 'object' && result.uri) return [result];
  return [];
}

export function formatLocations(result, kind, filePath, line, col) {
  const locs = normalizeLocations(result);
  const pos = `${filePath}:${line}:${col}`;
  if (!locs.length) return `No ${kind} found for symbol at ${pos}`;
  const lines = locs.map((l, i) => {
    const p = (l.uri || '').replace(/^file:\/\//, '');
    return `${i + 1}. ${p}:${l.range.start.line + 1}:${l.range.start.character + 1}`;
  });
  return `${kind} for symbol at ${pos} (${locs.length}):\n\n${lines.join('\n')}`;
}

function formatSymbolTree(symbols, indent = 0) {
  const out = [];
  const pad = '  '.repeat(indent);
  for (const sym of symbols) {
    const kind = KINDS[sym.kind] || `kind(${sym.kind})`;
    const r = sym.selectionRange || sym.range || sym.location?.range;
    const at = r ? ` line ${r.start.line + 1}:${r.start.character + 1}` : '';
    out.push(`${pad}${sym.name} (${kind})${at}`);
    if (sym.children?.length) out.push(...formatSymbolTree(sym.children, indent + 1));
  }
  return out;
}

export function formatSymbols(symbols, filePath) {
  if (!Array.isArray(symbols) || !symbols.length) return `No symbols found in ${filePath}`;
  return `Symbols in ${filePath} (${symbols.length} top-level):\n\n${formatSymbolTree(symbols).join('\n')}`;
}
