/**
 * Query builders — merge user query with project defaults (logs + RUM).
 */

/** Build logs query: service / env / defaultTags when not already in query. */
export function buildQuery(params, config) {
  const parts = [params.query];

  const service = params.service ?? config.service;
  if (service && !params.query.includes('service:')) {
    parts.push(`service:${service}`);
  }

  const env = params.env ?? config.env;
  if (env && !params.query.includes('env:')) {
    parts.push(`env:${env}`);
  }

  if (config.defaultTags) {
    for (const tag of config.defaultTags) {
      const tagKey = tag.split(':')[0];
      if (!params.query.includes(`${tagKey}:`)) parts.push(tag);
    }
  }

  return parts.join(' ');
}

/**
 * Build RUM query. Defaults to `@type:session` unless query scopes `@type`.
 * Merges rumApplicationId, rumService/service, env, defaultTags.
 */
export function buildRumQuery(params, config) {
  const parts = [];
  if (params.query.trim().length > 0) parts.push(params.query);

  if (!params.query.includes('@type:')) {
    parts.push('@type:session');
  }

  const applicationId = params.applicationId ?? config.rumApplicationId;
  if (applicationId && !params.query.includes('@application.id:')) {
    parts.push(`@application.id:${applicationId}`);
  }

  const service = params.service ?? config.rumService ?? config.service;
  if (service && !params.query.includes('service:')) {
    parts.push(`service:${service}`);
  }

  const env = params.env ?? config.env;
  if (env && !params.query.includes('env:')) {
    parts.push(`env:${env}`);
  }

  if (config.defaultTags) {
    for (const tag of config.defaultTags) {
      const tagKey = tag.split(':')[0];
      if (!params.query.includes(`${tagKey}:`)) parts.push(tag);
    }
  }

  return parts.join(' ');
}
