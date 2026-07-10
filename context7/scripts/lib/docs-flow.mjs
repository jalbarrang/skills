import { fetchLibraryDocs } from './api.mjs';
import { buildDocRef, extractVersionInfo, getDocCacheByRef, putDocCache } from './cache-docs.mjs';
import { curateDocText } from './curation.mjs';
import { buildEffectiveQuery, formatResolveResults, summarizeError } from './format.mjs';
import { normalizeText } from './hash.mjs';
import { resolveLibraries } from './resolve-flow.mjs';
import { displayTitle } from './select.mjs';
import { loadSettings, requireApiKey } from './settings.mjs';

function normalizedLibraryNameFromResult(result, fallback) {
  return normalizeText(result?.title || fallback || 'unknown-library');
}

export async function getDocsEntry(params) {
  const settings = loadSettings();
  const page =
    typeof params.page === 'number' && Number.isFinite(params.page)
      ? Math.max(1, Math.floor(params.page))
      : 1;
  const effectiveQuery = buildEffectiveQuery(params.query, params.topic, page);

  let libraryId = params.libraryId?.trim();
  let libraryName = params.libraryName?.trim();
  let resolvedResult;

  if (!libraryId) {
    if (!libraryName) {
      throw new Error('docs.mjs requires either --id or --name.');
    }
    const resolveResult = await resolveLibraries({ libraryName, query: params.query });
    const formatted = formatResolveResults(resolveResult.response, libraryName);
    if (!formatted.recommended || formatted.ambiguous) {
      return {
        ok: false,
        text: `${formatted.text}\n\nUnable to safely auto-resolve before fetching docs. Run resolve.mjs or pass --id </org/lib>.`,
      };
    }
    libraryId = formatted.recommended.id;
    resolvedResult = formatted.recommended;
    libraryName = displayTitle(formatted.recommended);
  }

  const docRef = buildDocRef(libraryId, effectiveQuery, page);
  const cached = await getDocCacheByRef(settings, docRef);
  if (cached.entry && cached.fresh) {
    return { ok: true, entry: cached.entry, source: 'fresh-cache', docRef };
  }

  requireApiKey(settings);
  const network = await fetchLibraryDocs(settings, { libraryId, query: effectiveQuery });
  if (network.ok) {
    const version = extractVersionInfo(libraryId);
    const name = libraryName || displayTitle(resolvedResult) || libraryId;
    const curated = curateDocText({
      rawText: network.data,
      libraryId,
      libraryName: name,
      libraryVersion: version.normalized,
      query: params.query,
      topic: params.topic,
      page,
      docRef,
    });
    const entry = await putDocCache(settings, {
      docRef,
      libraryId,
      libraryName: name,
      normalizedLibraryName: normalizedLibraryNameFromResult(resolvedResult, libraryName),
      libraryVersion: version.normalized,
      libraryVersionRaw: version.raw,
      query: params.query?.trim() || 'overview',
      topic: params.topic?.trim(),
      effectiveQuery,
      page,
      rawText: network.data,
      curatedText: curated.text,
    });
    return { ok: true, entry, source: 'network', docRef };
  }

  if (cached.entry) {
    return { ok: true, entry: cached.entry, source: 'stale-cache', docRef };
  }
  throw new Error(summarizeError(network.error));
}
