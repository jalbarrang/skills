/**
 * Task templating, JSON-pointer resolution, and bounded concurrency. Faithful port of the executor helpers in pi-subagent's `workflow-rpc.ts`.
 */

/** Resolve an RFC 6901 JSON pointer against a value (`~1` → `/`, `~0` → `~`). */
export function pathValue(value, pointer) {
  if (pointer === '' || pointer === '/') return value;
  return pointer
    .split('/')
    .slice(1)
    .reduce((current, part) => {
      if (current === null || typeof current !== 'object') return undefined;
      return current[part.replace(/~1/g, '/').replace(/~0/g, '~')];
    }, value);
}

/**
 * Substitute workflow placeholders into a step task. Semantics match pi-subagent exactly: `{task}` → the workflow task, `{previous}` → previous phase output, `{outputs.KEY}` → JSON-stringified named output (empty string when missing), `{item.prop}` → stringified item property (fan-out only), `{item}` → JSON-stringified fan-out item.
 */
export function template(task, workflowTask, previous, outputs, item) {
  return task
    .replace(/\{task\}/g, workflowTask)
    .replace(/\{previous\}/g, previous)
    .replace(/\{outputs\.([A-Za-z][\w-]*)\}/g, (_match, key) => JSON.stringify(outputs[key] ?? ''))
    .replace(/\{([A-Za-z][\w-]*)\.([A-Za-z][\w-]*)\}/g, (_match, key, property) => {
      if (!item || key === 'outputs') return _match;
      const value = item[property];
      return value === undefined ? _match : String(value);
    })
    .replace(/\{item\}/g, item === undefined ? '{item}' : JSON.stringify(item));
}

/** Run `fn` over `values` with at most `concurrency` in flight; results keep input order. */
export async function mapWithConcurrency(values, concurrency, fn) {
  const result = Array.from({ length: values.length });
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, values.length)) }, async () => {
    while (next < values.length) {
      const index = next++;
      result[index] = await fn(values[index], index);
    }
  });
  await Promise.all(workers);
  return result;
}

/**
 * Coerce an agent's text output into structured data for fan-out. Deviation from the pi executor (which only fans out from already-structured outputs): if the value is a string we try `JSON.parse` on the whole text, then on the first fenced ```json block; if both fail the raw value is returned unchanged.
 */
export function coerceJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through to fenced-block extraction
  }
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through
    }
  }
  return value;
}
