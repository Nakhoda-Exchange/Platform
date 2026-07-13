import { fail, ok, type Result } from "@/lib/core/domain/shared/result";
import type {
  Chain,
  TokenIdentity,
} from "@/lib/core/domain/shared/token-identity";
import type {
  MarketStatsProvider,
  MarketStatsSnapshot,
} from "@/lib/core/application/insights/ports/insights.port";
import { fetchJson } from "./fetch-json";

/**
 * DexScreener — price/mcap/fdv/liquidity/volume/age, both chains, keyless.
 * Provides the MarketStats capability. Docs: https://docs.dexscreener.com/api/reference
 */

const DEX_CHAIN_ID: Record<Chain, string> = {
  solana: "solana",
  ethereum: "ethereum",
  bsc: "bsc",
  base: "base",
};

interface DexPair {
  chainId: string;
  pairAddress: string;
  priceUsd?: string;
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  volume?: { h24?: number };
  pairCreatedAt?: number; // epoch ms
}
interface DexResponse {
  pairs: DexPair[] | null;
}

/** Pure DTO → snapshot mapping (tested). Picks the deepest-liquidity pair on
 *  the token's chain; null when there's no liquid pair. */
export function mapDexScreenerStats(
  res: DexResponse,
  chain: Chain,
  now: number,
): MarketStatsSnapshot | null {
  const chainId = DEX_CHAIN_ID[chain];
  const pairs = (res.pairs ?? []).filter(
    (p) => p.chainId === chainId && (p.liquidity?.usd ?? 0) > 0,
  );
  if (pairs.length === 0) return null;
  const best = pairs.reduce((a, b) =>
    (b.liquidity?.usd ?? 0) > (a.liquidity?.usd ?? 0) ? b : a,
  );
  return {
    source: "dexscreener",
    fetchedAt: now,
    priceUsd: Number(best.priceUsd ?? 0),
    marketCapUsd: best.marketCap ?? 0,
    fdvUsd: best.fdv ?? best.marketCap ?? 0,
    volume24hUsd: best.volume?.h24 ?? 0,
    liquidityUsd: best.liquidity?.usd ?? 0,
    ageMs: best.pairCreatedAt ? Math.max(0, now - best.pairCreatedAt) : 0,
    athPriceUsd: null, // DexScreener doesn't expose ATH
  };
}

export class DexScreenerProvider implements MarketStatsProvider {
  async getMarketStats(
    token: TokenIdentity,
  ): Promise<Result<MarketStatsSnapshot>> {
    const res = await fetchJson<DexResponse>(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(token.address)}`,
    );
    if (!res.ok) return res;
    const snap = mapDexScreenerStats(res.data, token.chain, Date.now());
    if (!snap) {
      return fail("NO_PAIR", "بازار نقدشونده‌ای برای این توکن یافت نشد.");
    }
    return ok(snap);
  }
}
