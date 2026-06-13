import 'server-only';
import Redis from 'ioredis';

// Optional cache. If REDIS_URL is unset (e.g. local `bun run dev` without a
// redis container) caching is simply disabled and everything falls back to the
// DB. Connection/cache errors never break a request.
const g = globalThis as unknown as { _redis?: Redis | null };

export function getRedis(): Redis | null {
  if (g._redis !== undefined) return g._redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    g._redis = null;
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: false,
  });
  client.on('error', () => {
    /* swallow — cache is best-effort */
  });
  g._redis = client;
  return client;
}

// Best-effort GET; returns null on miss or any error.
export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const v = await r.get(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

// Best-effort SET with TTL (seconds); ignores errors.
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    /* ignore */
  }
}

// Best-effort DEL of one or more keys; ignores errors.
export async function cacheDel(...keys: string[]): Promise<void> {
  const r = getRedis();
  if (!r || keys.length === 0) return;
  try {
    await r.del(...keys);
  } catch {
    /* ignore */
  }
}
