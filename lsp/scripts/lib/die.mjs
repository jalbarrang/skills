/** Print actionable stderr and exit non-zero. */
export function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}
