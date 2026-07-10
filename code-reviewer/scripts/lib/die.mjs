/** Print actionable stderr and exit non-zero. Never throw uncaught from entrypoints. */
export function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

export function fail(err) {
  die(err?.message || String(err));
}
