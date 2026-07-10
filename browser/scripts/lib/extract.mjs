/** Minimal HTML → markdown (no readability/turndown). Fidelity limits documented in SKILL.md. */
import { attr, bodyHtml, decodeEntities, stripChrome, stripTags, titleFromHtml } from './html.mjs';

const MAX_MD = 50_000;
const TAG_RE = /<\/?[a-zA-Z][^>]*?(?:"[^"]*"|'[^']*'|[^'">])*?>/g;

function collapse(md) {
  return md.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function convertBlock(html) {
  let s = String(html);
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, inner) => `\n${'#'.repeat(Number(n))} ${stripTags(inner)}\n\n`);
  s = s.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, c) => `\n\`\`\`\n${decodeEntities(c.replace(TAG_RE, ''))}\n\`\`\`\n\n`);
  s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, c) => `\n\`\`\`\n${decodeEntities(c.replace(TAG_RE, ''))}\n\`\`\`\n\n`);
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => `\`${stripTags(c)}\``);
  s = s.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, a, inner) => {
    const href = attr(a, 'href');
    const text = stripTags(inner) || href;
    return href && !href.startsWith('#') ? `[${text}](${href})` : text;
  });
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, i) => `**${stripTags(i)}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, i) => `*${stripTags(i)}*`);
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, i) => `- ${stripTags(i)}\n`);
  s = s.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n\n').replace(/<p[^>]*>/gi, '');
  s = s.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, row) => {
    const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => stripTags(m[1]));
    return cells.length ? `| ${cells.join(' | ')} |\n` : '';
  });
  s = s.replace(/<\/?(table|thead|tbody|tfoot)[^>]*>/gi, '\n');
  s = s.replace(TAG_RE, ' ');
  return decodeEntities(s);
}

export function htmlToMarkdown(html, url = '') {
  const title = titleFromHtml(html);
  const cleaned = stripChrome(bodyHtml(html));
  let md = collapse(convertBlock(cleaned));
  if (title && !md.startsWith('# ')) md = `# ${title}\n\n${md}`;
  if (md.length > MAX_MD) md = `${md.slice(0, MAX_MD)}\n\n[Truncated at 50,000 characters]`;
  if (!md.trim()) md = title || url || '(empty)';
  return { title: title || url, markdown: md };
}
