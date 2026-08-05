const attempts = new Map<string, { count: number; resetAt: number }>();

// Public endpoints (e.g. /api/track, /recoger) see a different key per IP,
// so without this the map would grow forever — entries only ever got
// cleaned up when that exact key was hit again. Sweep expired entries on
// a timer instead of on every call, so steady traffic doesn't pay for it.
// unref() keeps this from blocking the process from exiting (matters for
// serverless/edge-adjacent runtimes and for scripts that import this module).
const SWEEP_INTERVAL_MS = 5 * 60_000;
const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(key);
  }
}, SWEEP_INTERVAL_MS);
sweepTimer.unref?.();

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  return { ok: true, remaining: limit - entry.count };
}
