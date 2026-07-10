import { chooseSections, normalizeWhitespace } from './curation-sections.mjs';

const MAX_CURATED_CHARS = 12_000;

export function curateDocText(input) {
  const sections = chooseSections(input.rawText, input.query, input.topic);
  const headerLines = [
    `Library: ${input.libraryName}`,
    `Library ID: ${input.libraryId}`,
    input.libraryVersion ? `Version: ${input.libraryVersion}` : undefined,
    input.query ? `Query: ${input.query}` : undefined,
    input.topic ? `Topic: ${input.topic}` : undefined,
    `Page: ${input.page}`,
    '',
    'Relevant documentation:',
    '',
  ].filter((line) => line !== undefined);
  const footerLines = ['', `Raw cached document available via docRef: ${input.docRef}`];
  let selectedSectionCount = 0;
  let body = '';
  let truncated = false;
  const budget = Math.max(
    2_000,
    MAX_CURATED_CHARS - headerLines.join('\n').length - footerLines.join('\n').length,
  );

  for (const section of sections) {
    const next = body ? `${body}\n\n${section.text}` : section.text;
    if (next.length > budget) {
      if (!body) {
        body = section.text.slice(0, budget);
        truncated = true;
        selectedSectionCount = 1;
      }
      break;
    }
    body = next;
    selectedSectionCount += 1;
  }

  if (!body) {
    body = normalizeWhitespace(input.rawText).slice(0, budget);
    truncated = normalizeWhitespace(input.rawText).length > budget;
    selectedSectionCount = body ? 1 : 0;
  }
  if (!truncated && normalizeWhitespace(input.rawText).length > body.length) {
    truncated = body.length < normalizeWhitespace(input.rawText).length;
  }

  return {
    text: `${headerLines.join('\n')}${body}${footerLines.join('\n')}`.trim(),
    truncated,
    selectedSectionCount,
    rawLength: normalizeWhitespace(input.rawText).length,
  };
}
