import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function readJsonFile(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function atomicWriteJson(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, JSON.stringify(value, null, 2));
  await rename(tempPath, filePath);
}

export async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}
