export function observationIsStale(
  lastSuccess: number | null,
  error: unknown,
  now: number,
  maxAgeMs: number,
) {
  return lastSuccess === null || Boolean(error) || now - lastSuccess > maxAgeMs;
}
