import { existsSync } from 'node:fs';
import { getDocsPaths } from './cache-paths.mjs';
import { atomicWriteJson, ensureDir, readJsonFile } from './cache-io.mjs';
import { hash, isFresh, toIso } from './hash.mjs';

export function buildDocRef(libraryId, effectiveQuery, page) {
  return `ctx7:docs:${hash(`${libraryId}::${effectiveQuery}::${page}`)}`;
}

export function extractVersionInfo(libraryId) {
  const parts = libraryId.split('/').filter(Boolean);
  if (parts.length <= 2) return {};
  const raw = parts.slice(2).join('/');
  return { raw, normalized: raw.replace(/^v/, '') };
}

/** Read-through primary then legacy; stale entries returned with fresh:false. */
export async function getDocCacheByRef(settings, docRef) {
  const objectKey = hash(docRef);
  for (const dir of settings.cacheReadDirs) {
    const { objectPath } = getDocsPaths(dir, objectKey);
    if (!existsSync(objectPath)) continue;
    const entry = await readJsonFile(objectPath, undefined);
    if (!entry) continue;
    if (!isFresh(entry.expiresAt)) return { entry, fresh: false };
    return { entry, fresh: true };
  }
  return { fresh: false };
}

export async function putDocCache(settings, params) {
  const objectKey = hash(params.docRef);
  const now = Date.now();
  const entry = {
    ...params,
    kind: 'docs',
    objectKey,
    createdAt: toIso(now),
    expiresAt: toIso(now + settings.docsTtlMs),
  };
  const paths = getDocsPaths(settings.cacheDir, objectKey);
  await ensureDir(paths.objectsDir);
  await ensureDir(paths.indexDir);
  await atomicWriteJson(paths.objectPath, entry);

  const all = await readJsonFile(paths.allIndexPath, []);
  const indexEntry = {
    kind: 'docs',
    docRef: entry.docRef,
    objectKey,
    libraryId: entry.libraryId,
    libraryName: entry.libraryName,
    normalizedLibraryName: entry.normalizedLibraryName,
    libraryVersion: entry.libraryVersion,
    libraryVersionRaw: entry.libraryVersionRaw,
    query: entry.query,
    topic: entry.topic,
    effectiveQuery: entry.effectiveQuery,
    page: entry.page,
    createdAt: entry.createdAt,
    expiresAt: entry.expiresAt,
    rawLength: entry.rawText.length,
    curatedLength: entry.curatedText.length,
  };
  const nextAll = all.filter((item) => item.docRef !== entry.docRef).concat(indexEntry);
  await atomicWriteJson(paths.allIndexPath, nextAll);

  const byRef = await readJsonFile(paths.byRefPath, {});
  byRef[entry.docRef] = indexEntry;
  await atomicWriteJson(paths.byRefPath, byRef);
  return entry;
}
