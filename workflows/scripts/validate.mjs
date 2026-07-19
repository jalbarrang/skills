#!/usr/bin/env node
/**
 * Validate a workflow JSON file or saved chain name.
 *
 * Usage: node validate.mjs <workflow.json | chain-name>
 *
 * Exit 0 with a phase digest on success; exit 1 with every validation error on stderr otherwise.
 */
import { resolveWorkflowRef } from './lib/chains.mjs';
import { validateWorkflowSpec, workflowSummary } from './lib/spec.mjs';

function main() {
  const ref = process.argv[2];
  if (!ref || ref === '--help' || ref === '-h') {
    console.error('Usage: node validate.mjs <workflow.json | chain-name>');
    process.exit(ref ? 0 : 1);
  }

  let resolved;
  try {
    resolved = resolveWorkflowRef(process.cwd(), ref);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(resolved.raw);
  } catch (err) {
    console.error(`${resolved.path} is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  const validation = validateWorkflowSpec(parsed);
  if (!validation.valid) {
    console.error(`Invalid workflow (${resolved.path}):`);
    for (const error of validation.errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(workflowSummary(validation.normalized, validation.maximumAgentCount));
  console.log(`\nValid. Source: ${resolved.path}`);
}

main();
