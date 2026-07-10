import { join } from 'node:path';

export function getResolvePaths(cacheDir, objectKey) {
  const base = join(cacheDir, 'resolve');
  const indexDir = join(base, 'index');
  return {
    base,
    objectsDir: join(base, 'objects'),
    indexDir,
    allIndexPath: join(indexDir, 'all.json'),
    byLibraryPath: join(indexDir, 'by-library.json'),
    objectPath: join(base, 'objects', `${objectKey}.json`),
  };
}

export function getDocsPaths(cacheDir, objectKey) {
  const base = join(cacheDir, 'docs');
  const indexDir = join(base, 'index');
  return {
    base,
    objectsDir: join(base, 'objects'),
    indexDir,
    allIndexPath: join(indexDir, 'all.json'),
    byRefPath: join(indexDir, 'by-ref.json'),
    byLibraryIdPath: join(indexDir, 'by-library-id.json'),
    byLibraryNamePath: join(indexDir, 'by-library-name.json'),
    byVersionPath: join(indexDir, 'by-version.json'),
    objectPath: join(base, 'objects', `${objectKey}.json`),
  };
}
