import { ok, type Result } from "@/lib/core/domain/shared/result";

/**
 * Per-capability TTL cache for provider snapshots. Not one blanket TTL: price/
 * liquidity churns in seconds, safety/contract data in minutes. Process-global
 * (module singleton) — on serverless it's per-instance, which is fine for a
 * read cache; upgrade to a shared KV if cross-instance freshness ever matters.
 *
 * On a fetch FAILURE we serve the last-good (expired) value marked `fresh:false`
 * so one provider hiccup degrades a metric to `stale`, not `unavailable`.
 * ponytail: unbounded Map keyed by capability:chain:address — bounded in
 * practice by distinct tokens viewed; add LRU eviction if it ever grows.
 */

export type Capability =
  "marketStats" | "safety" | "holders" | "flow" | "nakhoda";

export const CACHE_TTL_MS: Record<Capability, number> = {
  marketStats: 10_000, // price / liquidity — seconds
  flow: 45_000, // trade flow — ~1 min
  holders: 180_000, // holder counts — ~3 min
  safety: 720_000, // contract / safety — ~12 min
  nakhoda: 30_000, // our own order flow
};

interface CacheEntry {
  value: unknown;
  fetchedAt: number;
}

const store = new Map<string, CacheEntry>();

export interface Cached<T> {
  value: T;
  fetchedAt: number; // epoch ms of the underlying fetch
  fresh: boolean; // false → served past TTL (stale)
}

export function cacheKey(
  capability: Capability,
  chain: string,
  address: string,
): string {
  return `${capability}:${chain}:${address}`;
}

/** Test/ops helper — clear the process cache. */
export function clearInsightsCache(): void {
  store.clear();
}

/**
 * Return the cached value if within `ttlMs`; otherwise refetch. If the refetch
 * fails but we hold a last-good value, serve it marked `fresh:false`. Only
 * propagate the failure when there's nothing cached at all.
 */
export async function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<Result<T>>,
): Promise<Result<Cached<T>>> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && now - hit.fetchedAt < ttlMs) {
    return ok({ value: hit.value as T, fetchedAt: hit.fetchedAt, fresh: true });
  }

  const res = await fetcher();
  if (res.ok) {
    store.set(key, { value: res.data, fetchedAt: now });
    return ok({ value: res.data, fetchedAt: now, fresh: true });
  }

  if (hit) {
    return ok({
      value: hit.value as T,
      fetchedAt: hit.fetchedAt,
      fresh: false,
    });
  }
  return res;
}
