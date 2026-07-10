import { buildHeaders, CONTEXT7_API_BASE_URL, parseErrorResponse } from './api-http.mjs';

export async function searchLibraries(settings, { libraryName, query }) {
  try {
    const url = new URL(`${CONTEXT7_API_BASE_URL}/v2/libs/search`);
    url.searchParams.set('query', query);
    url.searchParams.set('libraryName', libraryName);
    const response = await fetch(url, { headers: buildHeaders(settings) });
    if (!response.ok) return { ok: false, error: await parseErrorResponse(response, settings) };
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.results)) {
      return {
        ok: false,
        error: {
          kind: 'invalid_response',
          message: 'Context7 returned an invalid search response.',
        },
      };
    }
    return { ok: true, data: payload };
  } catch (error) {
    return {
      ok: false,
      error: {
        kind: 'network',
        message: 'Unable to reach Context7 right now.',
        upstreamMessage: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export async function fetchLibraryDocs(settings, { libraryId, query }) {
  try {
    const url = new URL(`${CONTEXT7_API_BASE_URL}/v2/context`);
    url.searchParams.set('libraryId', libraryId);
    url.searchParams.set('query', query);
    const response = await fetch(url, { headers: buildHeaders(settings) });
    if (!response.ok) return { ok: false, error: await parseErrorResponse(response, settings) };
    const text = await response.text();
    if (!text.trim()) {
      return {
        ok: false,
        error: {
          kind: 'not_found',
          message:
            'Context7 returned an empty documentation response. Try resolving the library again or refining the query.',
        },
      };
    }
    return { ok: true, data: text };
  } catch (error) {
    return {
      ok: false,
      error: {
        kind: 'network',
        message: 'Unable to reach Context7 right now.',
        upstreamMessage: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
