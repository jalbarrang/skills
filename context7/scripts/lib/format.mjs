import {
  benchmarkScore,
  displayTitle,
  selectBestLibrary,
  snippetCount,
  trustScore,
} from './select.mjs';

function formatResolveCandidate(result) {
  const parts = [
    `- Title: ${displayTitle(result)}`,
    `  Library ID: ${result.id}`,
    `  Description: ${result.description}`,
  ];
  if (snippetCount(result) > 0) parts.push(`  Code Snippets: ${snippetCount(result)}`);
  if (trustScore(result) > 0) parts.push(`  Source Reputation Score: ${trustScore(result)}`);
  if (benchmarkScore(result) > 0) parts.push(`  Benchmark Score: ${benchmarkScore(result)}`);
  if (result.versions?.length) parts.push(`  Versions: ${result.versions.join(', ')}`);
  if (result.source) parts.push(`  Source: ${result.source}`);
  return parts.join('\n');
}

export function formatResolveResults(response, libraryName) {
  if (!response.results.length) {
    return {
      text: `No Context7 libraries matched "${libraryName}".`,
      ambiguous: false,
    };
  }

  const recommendation = selectBestLibrary(response.results, libraryName);
  const header = [
    `Context7 matches for "${libraryName}":`,
    recommendation.selected ? `Recommended library ID: ${recommendation.selected.id}` : undefined,
    recommendation.ambiguous
      ? 'Auto-resolution is ambiguous; choose one of the candidates below.'
      : undefined,
  ].filter((line) => line !== undefined);

  const body = response.results.slice(0, 8).map(formatResolveCandidate).join('\n----------\n');
  return {
    text: `${header.join('\n')}\n\n${body}`,
    recommended: recommendation.selected,
    ambiguous: recommendation.ambiguous,
  };
}

export function buildEffectiveQuery(query, topic, page) {
  const parts = [query?.trim(), topic?.trim() ? `Focus: ${topic.trim()}` : undefined];
  if (typeof page === 'number' && page > 1) parts.push(`Requested page: ${page}`);
  return parts.filter(Boolean).join('\n\n') || 'overview';
}

export function summarizeError(error, extra) {
  return [error.message, extra].filter(Boolean).join(' ');
}
