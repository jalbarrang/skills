const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'their',
  'about', 'using', 'use', 'how', 'what', 'when', 'where', 'why', 'are', 'was',
  'were', 'can', 'you', 'need', 'docs', 'doc', 'library', 'page', 'requested', 'focus',
]);

function normalizeWhitespace(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function extractKeywords(query, topic) {
  const source = `${query ?? ''} ${topic ?? ''}`.toLowerCase();
  const words = source.match(/[a-z0-9._/-]{3,}/g) ?? [];
  const unique = new Set();
  for (const word of words) {
    if (STOPWORDS.has(word)) continue;
    unique.add(word);
  }
  return Array.from(unique).slice(0, 12);
}

function splitIntoSections(text) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];
  const lines = normalized.split('\n');
  const sections = [];
  let buffer = [];
  const flush = () => {
    const chunk = buffer.join('\n').trim();
    if (chunk) sections.push(chunk);
    buffer = [];
  };
  for (const line of lines) {
    const isHeading =
      /^#{1,6}\s+/.test(line) || (/^[A-Z][^\n]{0,100}:$/.test(line) && line.length < 100);
    if (isHeading && buffer.length > 0) flush();
    buffer.push(line);
    if (!line.trim()) flush();
  }
  flush();
  return sections.filter(Boolean);
}

function scoreSection(section, keywords, index) {
  if (keywords.length === 0) return Math.max(0, 10 - index);
  const lower = section.toLowerCase();
  const heading = section.split('\n')[0]?.toLowerCase() ?? '';
  let score = Math.max(0, 8 - index);
  for (const keyword of keywords) {
    const occurrences = lower.split(keyword).length - 1;
    if (occurrences > 0) score += occurrences * 4;
    if (heading.includes(keyword)) score += 6;
  }
  return score;
}

export function chooseSections(text, query, topic) {
  const keywords = extractKeywords(query, topic);
  const sections = splitIntoSections(text).map((section, index) => ({
    text: section,
    score: scoreSection(section, keywords, index),
    index,
  }));
  if (sections.length === 0) return [];
  const highSignal = sections
    .filter((section) => section.score > 8)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const picked = (
    highSignal.length > 0 ? highSignal : sections.slice().sort((a, b) => a.index - b.index)
  ).slice(0, 12);
  return picked.sort((a, b) => a.index - b.index);
}

export { normalizeWhitespace };
