/**
 * Default config keys for the jira skill (mirrors pi extension config.ts).
 */
import { loadConfig } from './config.mjs';

/** Curated field set: rich enough for context without dumping every custom field. */
export const DEFAULT_VIEW_FIELDS =
  'summary,issuetype,status,priority,assignee,reporter,labels,components,parent,description,comment,created,updated';

export const DEFAULT_CONFIG = {
  acliPath: 'acli',
  viewFields: DEFAULT_VIEW_FIELDS,
  searchLimit: 25,
};

/**
 * Qualifies a bare issue number with the default project (e.g. "123" -> "PROJ-123").
 * Leaves already-qualified keys (containing a dash) untouched.
 * @param {string} key
 * @param {string} [defaultProject]
 */
export function qualifyKey(key, defaultProject) {
  const trimmed = key.trim();
  if (/^\d+$/.test(trimmed) && defaultProject) {
    return `${defaultProject}-${trimmed}`;
  }
  return trimmed;
}

/**
 * Load jira config via shared resolver, applying typed defaults.
 * @returns {{ acliPath: string; viewFields: string; searchLimit: number; defaultProject?: string }}
 */
export function loadJiraConfig() {
  const raw = loadConfig('jira', DEFAULT_CONFIG);
  const acliPath =
    typeof raw.acliPath === 'string' && raw.acliPath.trim() ? raw.acliPath.trim() : DEFAULT_CONFIG.acliPath;
  const viewFields =
    typeof raw.viewFields === 'string' && raw.viewFields.trim()
      ? raw.viewFields.trim()
      : DEFAULT_CONFIG.viewFields;
  let searchLimit = DEFAULT_CONFIG.searchLimit;
  if (typeof raw.searchLimit === 'number' && Number.isInteger(raw.searchLimit) && raw.searchLimit >= 1) {
    searchLimit = raw.searchLimit;
  } else if (typeof raw.searchLimit === 'string' && /^\d+$/.test(raw.searchLimit)) {
    const n = Number(raw.searchLimit);
    if (n >= 1) searchLimit = n;
  }
  /** @type {{ acliPath: string; viewFields: string; searchLimit: number; defaultProject?: string }} */
  const cfg = { acliPath, viewFields, searchLimit };
  if (typeof raw.defaultProject === 'string' && raw.defaultProject.trim()) {
    cfg.defaultProject = raw.defaultProject.trim();
  }
  return cfg;
}
