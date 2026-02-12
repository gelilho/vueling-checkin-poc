/**
 * Formatting utilities — shared across components and lib.
 */

/** Format milliseconds as "X.Xs" */
export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Promise-based delay */
export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Execute an async function with a minimum execution time.
 * Ensures the function takes at least `minMs` milliseconds.
 * Used for visual pacing in pipeline stages.
 */
export async function withMinDelay<T>(
  fn: () => Promise<T>,
  minMs: number
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;
  if (elapsed < minMs) {
    await delay(minMs - elapsed);
  }
  return result;
}
