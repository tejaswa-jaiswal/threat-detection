/**
 * Exponential backoff with jitter.
 *
 *   delay = min(maxMs, initialMs * 2^attempt) ± jitterRatio * delay
 */
export function backoff(
  attempt: number,
  initialMs: number,
  maxMs: number,
  jitterRatio = 0.25,
  random: () => number = Math.random,
): number {
  const base = Math.min(maxMs, initialMs * 2 ** attempt);
  const jitter = base * jitterRatio * (random() * 2 - 1);
  return Math.max(0, Math.floor(base + jitter));
}