import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { getResolvePaths } from './cache-paths.mjs';
import { atomicWriteJson, ensureDir, readJsonFile } from './cache-io.mjs';
import { hash, isFresh, normalizeText, toIso } from './hash.mjs';

function resolveCacheKey(libraryName, query) {
  return `${normalizeText(libraryName)}::${normalizeText(query)}`;
}

/** Read-through: primary cacheDir first, then legacy cacheReadDirs. */
export async function getResolveCache(settings, libraryName, query) {
  const cacheKey = resolveCacheKey(libraryName, query);
  const objectKey = hash(cacheKey);
  for (const dir of settings.cacheReadDirs) {
    const { objectPath } = getResolvePaths(dir, objectKey);
    if (!existsSync(objectPath)) continue;
    const entry = await readJsonFile(objectPath, undefined);
    if (!entry) continue;
    if (!isFresh(entry.expiresAt)) {
      if (dir === settings.cacheDir) await rm(objectPath, { force: true });
      continue;
    }
    return { entry, fresh: true };
  }
  return { fresh: false };
}

export async function putResolveCache(settings, { libraryName, query, results }) {
  const cacheKey = resolveCacheKey(libraryName, query);
  const objectKey = hash(cacheKey);
  const now = Date.now();
  const entry = {
    kind: 'resolve',
    cacheKey,
    objectKey,
    libraryName,
    normalizedLibraryName: normalizeText(libraryName),
    query,
    createdAt: toIso(now),
    expiresAt: toIso(now + settings.resolveTtlMs),
    results,
  };
  const paths = getResolvePaths(settings.cacheDir, objectKey);
  await ensureDir(paths.objectsDir);
  await ensureDir(paths.indexDir);
  await atomicWriteJson(paths.objectPath, entry);

  const all = await readJsonFile(paths.allIndexPath, []);
  const nextAll = all
    .filter((item) => item.objectKey !== objectKey)
    .concat({
      kind: 'resolve',
      cacheKey,
      objectKey,
      libraryName: entry.libraryName,
      normalizedLibraryName: entry.normalizedLibraryName,
      query: entry.query,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      resultCount: entry.results.length,
    });
  await atomicWriteJson(paths.allIndexPath, nextAll);
  return entry;
}
