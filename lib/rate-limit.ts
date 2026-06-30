// Rate limiter with an optional shared backend.
//
// When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, limits are
// enforced in Redis so they hold ACROSS all server instances (correct for a
// multi-instance Railway deploy). Otherwise it falls back to a per-instance
// in-memory map — fine for a single instance / local dev.

type Result = { ok: boolean; remaining: number };

const attempts = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, limit: number, windowMs: number): Result {
  const now = Date.now();

  // Opportunistically prune expired entries so the map doesn't grow unbounded.
  if (attempts.size > 500) {
    for (const [k, v] of attempts) if (now > v.resetAt) attempts.delete(k);
  }

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

async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<Result | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const ttl = Math.ceil(windowMs / 1000);
    // One round-trip: INCR the counter, and set the TTL only when it's new.
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, ttl, "NX"],
      ]),
    });
    if (!res.ok) return null;
    const data = await res.json(); // [{ result: count }, { result: 0|1 }]
    const count = Number(data?.[0]?.result ?? 0);
    if (!count) return null; // unexpected shape → fall back to memory
    return { ok: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return null; // network/Redis error → fall back to memory
  }
}

export async function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): Promise<Result> {
  const viaRedis = await redisRateLimit(key, limit, windowMs);
  if (viaRedis) return viaRedis;
  return memoryRateLimit(key, limit, windowMs);
}
