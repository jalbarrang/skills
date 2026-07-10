/** Lightweight HTML helpers — no DOM parser dependency. */

const ENTITY = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Match a tag including quoted attributes that may contain `>`. */
const TAG_RE = /<\/?[a-zA-Z][^>]*?(?:"[^"]*"|'[^']*'|[^'">])*?>/g;

export function decodeEntities(text) {
  return String(text ?? '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => ENTITY[name.toLowerCase()] ?? m);
}

export function stripTags(html) {
  return decodeEntities(String(html ?? '').replace(TAG_RE, ' ')).replace(/\s+/g, ' ').trim();
}

/** Remove chrome + MediaWiki template noise; prefer main/article content. */
export function stripChrome(html) {
  let out = String(html ?? '');
  const main =
    out.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
    out.match(/id="mw-content-text"[^>]*>([\s\S]*?)<div\s+id="mw-data-after-content"/i)?.[1] ||
    out.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
  if (main) out = main;
  // Drop bulky MediaWiki JSON attrs so later [^>]* tag matchers stay safe.
  out = out.replace(/\s+data-mw(?:-[a-z0-9-]+)?=(['"])[\s\S]*?\1/gi, '');
  out = out.replace(/<(script|style|noscript|svg|iframe|templatestyles)\b[\s\S]*?<\/\1>/gi, '');
  out = out.replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, '');
  out = out.replace(/<table\b[^>]*class="[^"]*(?:infobox|navbox|ambox|mbox|sidebar)[^"]*"[\s\S]*?<\/table>/gi, '');
  out = out.replace(/<!--[\s\S]*?-->/g, '');
  return out;
}

export function attr(tag, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const m = String(tag).match(re);
  return m ? decodeEntities(m[2] ?? m[3] ?? m[4] ?? '') : '';
}

export function titleFromHtml(html) {
  const m = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]) : '';
}

export function bodyHtml(html) {
  const m = String(html).match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : String(html);
}
