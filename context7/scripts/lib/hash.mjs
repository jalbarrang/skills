import { createHash } from 'node:crypto';

export function hash(input) {
  return createHash('sha256').update(input).digest('hex').slice(0, 24);
}

export function normalizeText(value) {
  return (value ?? '').trim().toLowerCase();
}

export function toIso(ms) {
  return new Date(ms).toISOString();
}

export function isFresh(expiresAt) {
  return new Date(expiresAt).getTime() > Date.now();
}

export function hoursToMs(hours) {
  return hours * 60 * 60 * 1000;
}
