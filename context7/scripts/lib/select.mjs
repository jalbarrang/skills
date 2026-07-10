import { normalizeText } from './hash.mjs';

function snippetCount(result) {
  return typeof result.totalSnippets === 'number' && result.totalSnippets > 0
    ? result.totalSnippets
    : 0;
}

function benchmarkScore(result) {
  return typeof result.benchmarkScore === 'number' ? result.benchmarkScore : 0;
}

function trustScore(result) {
  return typeof result.trustScore === 'number' ? result.trustScore : 0;
}

/** Pick a clear winner or mark ambiguous — mirrors the pi extension scorer. */
export function selectBestLibrary(results, libraryName) {
  if (results.length === 0) return { ambiguous: false };
  if (results.length === 1) return { selected: results[0], ambiguous: false };

  const target = normalizeText(libraryName).replace(/^@/, '');
  const scored = results
    .map((result) => {
      const title = normalizeText(result.title);
      const id = normalizeText(result.id);
      let score =
        benchmarkScore(result) / 10 + trustScore(result) + Math.min(snippetCount(result), 100) / 20;
      if (title === target) score += 25;
      if (title.includes(target)) score += 12;
      if (id.endsWith(`/${target}`) || id.includes(`/${target}/`)) score += 12;
      return { result, score };
    })
    .sort((a, b) => b.score - a.score);

  const [top, second] = scored;
  if (!second) return { selected: top.result, ambiguous: false };

  const clearByExactMatch =
    normalizeText(top.result.title) === target ||
    normalizeText(top.result.id).endsWith(`/${target}`) ||
    top.score >= second.score + 8;

  if (clearByExactMatch) return { selected: top.result, ambiguous: false };
  return { ambiguous: true };
}

export function displayTitle(result) {
  if (!result) return '';
  return result.title || result.id;
}

export { snippetCount, benchmarkScore, trustScore };
