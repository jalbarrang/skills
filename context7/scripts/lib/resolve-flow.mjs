import { searchLibraries } from './api.mjs';
import { getResolveCache, putResolveCache } from './cache-resolve.mjs';
import { summarizeError } from './format.mjs';
import { loadSettings, requireApiKey } from './settings.mjs';

export async function resolveLibraries(params) {
  const settings = loadSettings();
  const query = params.query?.trim() || params.libraryName.trim();
  const cached = await getResolveCache(settings, params.libraryName, query);

  if (cached.entry && cached.fresh) {
    return {
      source: 'fresh-cache',
      response: { results: cached.entry.results },
    };
  }

  requireApiKey(settings);
  const network = await searchLibraries(settings, {
    libraryName: params.libraryName,
    query,
  });
  if (network.ok) {
    const entry = await putResolveCache(settings, {
      libraryName: params.libraryName,
      query,
      results: network.data.results,
    });
    return {
      source: 'network',
      response: {
        results: entry.results,
        searchFilterApplied: network.data.searchFilterApplied,
      },
    };
  }

  if (cached.entry) {
    return {
      source: 'stale-cache',
      response: { results: cached.entry.results },
      staleBecause: network.error,
    };
  }

  throw new Error(summarizeError(network.error));
}
