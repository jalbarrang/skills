/**
 * Bounded, declarative workflow validation. Faithful port of pi-plan-mode's `workflow/spec.ts`.
 *
 * The format is deliberately a subset of a full orchestration model: no arbitrary code, loops, filesystem access, or implicit unbounded fan-out. Every fan-out declares `maxItems`, so a workflow's worst-case agent count is statically known before anything runs.
 */

const NAME = /^[a-z][a-z0-9-]{0,62}$/;
const OUTPUT = /^[A-Za-z][A-Za-z0-9_-]*$/;
const RESERVED_OUTPUTS = new Set(['__proto__', 'constructor', 'prototype']);
export const MAX_PHASES = 32;
export const MAX_CONCURRENCY = 16;
export const MAX_AGENTS = 100;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asPositiveInt(value) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

function isOutputName(value) {
  return OUTPUT.test(value) && !RESERVED_OUTPUTS.has(value);
}

function validateAgentStep(value, at, errors) {
  if (!isRecord(value)) {
    errors.push(`${at} must be an object.`);
    return undefined;
  }
  const agent = asText(value.agent);
  const task = asText(value.task);
  if (!agent) errors.push(`${at}.agent must be a non-empty agent name.`);
  if (!task) errors.push(`${at}.task must be a non-empty instruction.`);
  for (const [key, candidate] of Object.entries({ label: value.label, as: value.as, model: value.model, thinking: value.thinking })) {
    if (candidate !== undefined && !asText(candidate)) errors.push(`${at}.${key} must be a non-empty string.`);
  }
  if (value.as !== undefined && !isOutputName(String(value.as))) {
    errors.push(`${at}.as must be an identifier used by later phases.`);
  }
  return agent && task
    ? {
        agent,
        task,
        label: asText(value.label),
        as: asText(value.as),
        model: asText(value.model),
        thinking: asText(value.thinking),
      }
    : undefined;
}

function validateConcurrency(value, at, errors) {
  if (value === undefined) return undefined;
  const concurrency = asPositiveInt(value);
  if (!concurrency || concurrency > MAX_CONCURRENCY) {
    errors.push(`${at}.concurrency must be an integer from 1 to ${MAX_CONCURRENCY}.`);
    return undefined;
  }
  return concurrency;
}

/**
 * Validate and normalize untrusted workflow data. Returns `{ valid, errors, normalized?, maximumAgentCount?, phases? }`. A proposed workflow cannot silently exceed the static maximum agent count.
 */
export function validateWorkflowSpec(input) {
  const errors = [];
  if (!isRecord(input)) return { valid: false, errors: ['Workflow must be an object.'] };

  const name = asText(input.name);
  const description = asText(input.description);
  const task = asText(input.task);
  if (!name || !NAME.test(name)) errors.push('name must be kebab-case, start with a letter, and be at most 63 characters.');
  if (!description) errors.push('description must be a non-empty summary.');
  if (!task) errors.push('task must be the original task or a self-contained task statement.');
  if (input.agentScope !== undefined && !['user', 'project', 'both'].includes(String(input.agentScope))) {
    errors.push('agentScope must be user, project, or both.');
  }
  if (!Array.isArray(input.chain) || input.chain.length === 0) {
    errors.push('chain must contain at least one phase.');
    return { valid: false, errors };
  }
  if (input.chain.length > MAX_PHASES) errors.push(`chain may contain at most ${MAX_PHASES} phases.`);

  const outputs = new Set();
  let maximumAgentCount = 0;
  const chain = [];

  for (const [index, rawStep] of input.chain.entries()) {
    const at = `chain[${index}]`;
    if (!isRecord(rawStep)) {
      errors.push(`${at} must be an object.`);
      continue;
    }
    if ('agent' in rawStep) {
      const step = validateAgentStep(rawStep, at, errors);
      if (!step) continue;
      if (step.as) {
        if (outputs.has(step.as)) errors.push(`${at}.as duplicates output "${step.as}".`);
        outputs.add(step.as);
      }
      chain.push(step);
      maximumAgentCount += 1;
      continue;
    }
    if ('expand' in rawStep) {
      const expand = rawStep.expand;
      const parallel = validateAgentStep(rawStep.parallel, `${at}.parallel`, errors);
      const collect = rawStep.collect;
      if (!isRecord(expand)) {
        errors.push(`${at}.expand must be an object.`);
        continue;
      }
      const from = asText(expand.from);
      const path = asText(expand.path);
      const item = asText(expand.item);
      const maxItems = asPositiveInt(expand.maxItems);
      if (!from || !outputs.has(from)) errors.push(`${at}.expand.from must reference an earlier named output.`);
      if (!path?.startsWith('/')) errors.push(`${at}.expand.path must be a JSON pointer beginning with '/'.`);
      if (!item || !isOutputName(item)) errors.push(`${at}.expand.item must be an identifier.`);
      if (!maxItems) errors.push(`${at}.expand.maxItems must be a positive integer.`);
      if (!isRecord(collect) || !asText(collect.as) || !isOutputName(String(collect.as))) {
        errors.push(`${at}.collect.as must be an identifier.`);
      } else if (outputs.has(String(collect.as))) {
        errors.push(`${at}.collect.as duplicates output "${collect.as}".`);
      }
      const concurrency = validateConcurrency(rawStep.concurrency, at, errors);
      if (!parallel || !from || !path || !item || !maxItems || !isRecord(collect) || !asText(collect.as)) continue;
      outputs.add(String(collect.as));
      chain.push({
        expand: { from, path, item, maxItems },
        parallel,
        collect: { as: String(collect.as) },
        label: asText(rawStep.label),
        concurrency,
      });
      maximumAgentCount += maxItems;
      continue;
    }
    if (Array.isArray(rawStep.parallel)) {
      const tasks = rawStep.parallel
        .map((candidate, childIndex) => validateAgentStep(candidate, `${at}.parallel[${childIndex}]`, errors))
        .filter((candidate) => Boolean(candidate));
      if (tasks.length === 0) {
        errors.push(`${at}.parallel must contain at least one valid agent step.`);
        continue;
      }
      for (const task of tasks) {
        if (task.as) {
          if (outputs.has(task.as)) errors.push(`${at}.parallel output "${task.as}" is duplicated.`);
          outputs.add(task.as);
        }
      }
      chain.push({ parallel: tasks, label: asText(rawStep.label), concurrency: validateConcurrency(rawStep.concurrency, at, errors) });
      maximumAgentCount += tasks.length;
      continue;
    }
    errors.push(`${at} must be an agent, parallel, or bounded fan-out phase.`);
  }

  if (maximumAgentCount > MAX_AGENTS) {
    errors.push(`Workflow can spawn at most ${MAX_AGENTS} agents; this one can spawn ${maximumAgentCount}.`);
  }
  if (errors.length > 0 || !name || !description || !task) return { valid: false, errors };

  const normalized = {
    name,
    description,
    task,
    agentScope: input.agentScope,
    chain,
  };
  return {
    valid: true,
    errors: [],
    normalized,
    maximumAgentCount,
    phases: chain.map((step, index) => phaseLabel(step, index)),
  };
}

export function phaseLabel(step, index) {
  if ('agent' in step && !('expand' in step)) return step.label ?? step.agent;
  return step.label ?? `Phase ${index + 1}`;
}

export function workflowSummary(spec, maximumAgentCount) {
  return [
    `Workflow: ${spec.name}`,
    spec.description,
    `Maximum agents: ${maximumAgentCount}`,
    ...spec.chain.map((step, index) => `${index + 1}. ${phaseLabel(step, index)}`),
  ].join('\n');
}
