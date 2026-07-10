/** True when model should run via cursor-agent (prefix `cursor:`). */
export function isCursorModel(model) {
  return typeof model === 'string' && model.startsWith('cursor:');
}

/** Strip `cursor:` prefix for the cursor-agent --model flag. */
export function cursorModelId(model) {
  return isCursorModel(model) ? model.slice('cursor:'.length) : model;
}

/**
 * Resolve effective model/thinking: flag overrides beat agent frontmatter defaults.
 * @param {{ model?: string, thinking?: string }} agent
 * @param {{ model?: string, thinking?: string }} flags
 */
export function resolveModelOpts(agent, flags) {
  const model = flags.model || agent.model;
  if (!model) {
    return { error: 'No model: set frontmatter model or pass --model' };
  }
  const thinking = flags.thinking || agent.thinking || 'low';
  return { model, thinking, backend: isCursorModel(model) ? 'cursor' : 'pi' };
}
