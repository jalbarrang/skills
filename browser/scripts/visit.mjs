#!/usr/bin/env node
/**
 * visit.mjs <url> [--render]
 * Default: fetch + dependency-free readable-markdown extraction.
 * --render: shell out to agent-browser for JS-heavy pages.
 */
import { spawnSync } from 'node:child_process';
import { htmlToMarkdown } from './lib/extract.mjs';

const USER_AGENT = 'browser-skill/1.0';
const TIMEOUT_MS = 15_000;
const MAX_HTML = 1_000_000;

function usage() {
  console.error('Usage: node visit.mjs <url> [--render]');
  console.error('  Default fetches HTML and extracts markdown (no browser).');
  console.error('  --render  Open via agent-browser and print rendered page text.');
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let url;
  let render = false;
  for (const a of args) {
    if (a === '--render') { render = true; continue; }
    if (a.startsWith('-')) usage();
    if (url !== undefined) usage();
    url = a;
  }
  if (!url) usage();
  try {
    new URL(url);
  } catch {
    console.error(`Invalid URL: ${url}`);
    process.exit(1);
  }
  return { url, render };
}

function renderWithAgentBrowser(url) {
  const open = spawnSync('agent-browser', ['open', url], { encoding: 'utf8' });
  if (open.error?.code === 'ENOENT') {
    console.error('agent-browser not found on PATH. Install: brew install agent-browser && agent-browser install');
    process.exit(1);
  }
  if (open.status !== 0) {
    console.error(open.stderr?.trim() || open.stdout?.trim() || `agent-browser open failed (${open.status})`);
    process.exit(open.status || 1);
  }
  // No URL → read rendered DOM of the active tab (see agent-browser read --help).
  const read = spawnSync('agent-browser', ['read'], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (read.status !== 0) {
    console.error(read.stderr?.trim() || read.stdout?.trim() || `agent-browser read failed (${read.status})`);
    process.exit(read.status || 1);
  }
  const text = (read.stdout || '').trim();
  console.log(`Source: ${url}\nMethod: agent-browser\n\n${text}`);
}

async function fetchMarkdown(url) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
    },
  });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  const finalUrl = response.url || url;
  let html = await response.text();
  if (html.length > MAX_HTML) html = html.slice(0, MAX_HTML);
  const { title, markdown } = htmlToMarkdown(html, finalUrl);
  console.log(`Source: ${finalUrl}\nMethod: fetch\nTitle: ${title}\n\n${markdown}`);
}

async function main() {
  const { url, render } = parseArgs(process.argv);
  if (render) renderWithAgentBrowser(url);
  else await fetchMarkdown(url);
}

main().catch((err) => {
  console.error(err?.message || String(err));
  process.exit(1);
});
