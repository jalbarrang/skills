/**
 * One-shot LSP operation handlers.
 * Ops: diagnostics | hover | definitions | references | symbols.
 * CLI line/col are 1-based; converted to LSP 0-based here.
 */
import {
  formatDiagnostics,
  formatHover,
  formatLocations,
  formatSymbols,
} from './format.mjs';

function requirePos(flags, op) {
  const line = Number(flags.line);
  const col = Number(flags.col ?? flags.column);
  if (!Number.isInteger(line) || line < 1) {
    throw new Error(`--line N is required for --op ${op} (1-based)`);
  }
  if (!Number.isInteger(col) || col < 1) {
    throw new Error(`--col N is required for --op ${op} (1-based)`);
  }
  return { line, col, position: { line: line - 1, character: col - 1 } };
}

export async function runOp(session, op, filePath, flags) {
  const uri = await session.openFile(filePath);

  if (op === 'diagnostics') {
    await session.waitForDiagnostics(uri);
    return formatDiagnostics(filePath, session.getDiagnostics(uri));
  }

  if (op === 'symbols') {
    const result = await session.request('textDocument/documentSymbol', {
      textDocument: { uri },
    });
    return formatSymbols(result || [], filePath);
  }

  const { line, col, position } = requirePos(flags, op);
  const docPos = { textDocument: { uri }, position };

  if (op === 'hover') {
    const result = await session.request('textDocument/hover', docPos);
    return formatHover(result, filePath, line, col);
  }
  if (op === 'definitions') {
    const result = await session.request('textDocument/definition', docPos);
    return formatLocations(result, 'Definitions', filePath, line, col);
  }
  if (op === 'references') {
    const result = await session.request('textDocument/references', {
      ...docPos,
      context: { includeDeclaration: true },
    });
    return formatLocations(result, 'References', filePath, line, col);
  }

  throw new Error(`Unknown --op ${op}. Use: diagnostics|hover|definitions|references|symbols`);
}
