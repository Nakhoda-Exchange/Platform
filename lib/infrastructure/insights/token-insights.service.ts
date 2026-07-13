import { ok, type Result } from "@/lib/core/domain/shared/result";
import type {
  Chain,
  TokenIdentity,
} from "@/lib/core/domain/shared/token-identity";
import type {
  Metric,
  MetricStatus,
  Source,
  TokenInsights,
  TopHolder,
} from "@/lib/core/domain/insights/token-insights";
import {
  holderDeltaPercent,
  liquidityToMcap,
  mcapToFdv,
  priceImpactCurve,
  sniperSharePercent,
  top10PercentExcludingLpBurn,
  volumeToLiquidity,
} from "@/lib/core/domain/insights/metrics";
import type {
  FlowSnapshot,
  HoldersProvider,
  HoldersSnapshot,
  MarketStatsProvider,
  MarketStatsSnapshot,
  NakhodaFlowProvider,
  NakhodaFlowSnapshot,
  SafetyProvider,
  SafetySnapshot,
  TokenInsightsPort,
  TradeFlowProvider,
} from "@/lib/core/application/insights/ports/insights.port";
import { CACHE_TTL_MS, cacheKey, getCached, type Capability } from "./cache";

/**
 * The composite. Routes each capability by chain, fetches snapshots in parallel
 * (each through the per-capability TTL cache), runs the domain math, and
 * assembles the ONE normalized `TokenInsights`. Every metric fail-softs on its
 * own: a down provider degrades ITS metrics to `unavailable`/`stale`, never the
 * page, and nothing is fabricated.
 *
 * Routing is the injected per-chain provider map — a missing entry (provider
 * not built or no key) simply yields `unavailable` metrics.
 */
export interface InsightsProviderMap {
  marketStats: Partial<Record<Chain, MarketStatsProvider>>;
  safety: Partial<Record<Chain, SafetyProvider>>;
  holders: Partial<Record<Chain, HoldersProvider>>;
  flow: Partial<Record<Chain, TradeFlowProvider>>;
  nakhoda?: NakhodaFlowProvider;
}

/** A resolved capability fetch: the snapshot (or null) + how to stamp metrics. */
interface CapabilityResult<T> {
  snapshot: T | null;
  status: MetricStatus; // ok | stale (has value) | unavailable (no value)
  source: Source;
  lastUpdatedAt: number | null;
}

const UNAVAILABLE: MetricStatus = "unavailable";

function unavailable<T>(source: Source): CapabilityResult<T> {
  return { snapshot: null, status: UNAVAILABLE, source, lastUpdatedAt: null };
}

/** Build a Metric by picking a value off a capability snapshot. */
function pick<S, V>(
  cap: CapabilityResult<S>,
  select: (snap: S) => V | null,
): Metric<V> {
  if (cap.snapshot === null) {
    return {
      value: null,
      status: UNAVAILABLE,
      source: cap.source,
      lastUpdatedAt: null,
    };
  }
  return {
    value: select(cap.snapshot),
    status: cap.status,
    source: cap.source,
    lastUpdatedAt: cap.lastUpdatedAt,
  };
}

export class TokenInsightsService implements TokenInsightsPort {
  constructor(private readonly providers: InsightsProviderMap) {}

  private async load<T extends { source: Source }>(
    capability: Capability,
    token: TokenIdentity,
    fallbackSource: Source,
    call: (() => Promise<Result<T>>) | undefined,
  ): Promise<CapabilityResult<T>> {
    if (!call) return unavailable<T>(fallbackSource);
    const cached = await getCached<T>(
      cacheKey(capability, token.chain, token.address),
      CACHE_TTL_MS[capability],
      call,
    );
    if (!cached.ok) return unavailable<T>(fallbackSource);
    const { value, fetchedAt, fresh } = cached.data;
    return {
      snapshot: value,
      status: fresh ? "ok" : "stale",
      source: value.source,
      lastUpdatedAt: fetchedAt,
    };
  }

  async getInsights(
    token: TokenIdentity,
    usdToIrt: number,
  ): Promise<Result<TokenInsights>> {
    const { marketStats, safety, holders, flow, nakhoda } = this.providers;
    const chain = token.chain;

    const [stats, safe, hold, fl, nak] = await Promise.all([
      this.load<MarketStatsSnapshot>(
        "marketStats",
        token,
        "dexscreener",
        marketStats[chain] && (() => marketStats[chain]!.getMarketStats(token)),
      ),
      this.load<SafetySnapshot>(
        "safety",
        token,
        chain === "solana" ? "rugcheck" : "goplus",
        safety[chain] && (() => safety[chain]!.getSafety(token)),
      ),
      this.load<HoldersSnapshot>(
        "holders",
        token,
        chain === "solana" ? "birdeye" : "moralis",
        holders[chain] && (() => holders[chain]!.getHolders(token)),
      ),
      this.load<FlowSnapshot>(
        "flow",
        token,
        chain === "solana" ? "birdeye" : "moralis",
        flow[chain] && (() => flow[chain]!.getFlow(token)),
      ),
      this.load<NakhodaFlowSnapshot>(
        "nakhoda",
        token,
        "nakhoda",
        nakhoda && (() => nakhoda.getNakhodaFlow(token)),
      ),
    ]);

    // Cross-capability: prefer the holders provider's top holders; fall back to
    // whatever the safety report carried.
    const topHolders: TopHolder[] | null =
      hold.snapshot?.topHolders ?? safe.snapshot?.topHolders ?? null;
    const lpAddresses = hold.snapshot?.lpAddresses ?? [];

    const insights: TokenInsights = {
      token,
      generatedAt: Date.now(),

      exit: {
        liquidityUsd: pick(stats, (s) => s.liquidityUsd),
        liquidityToMcap: pick(stats, (s) =>
          liquidityToMcap(s.liquidityUsd, s.marketCapUsd),
        ),
        lp: pick(safe, (s) => s.lp),
        priceImpact: pick(stats, (s) =>
          priceImpactCurve(s.liquidityUsd * usdToIrt),
        ),
      },

      safety: {
        checks: safe.snapshot?.checks ?? [],
        failCount: pick(
          safe,
          (s) => s.checks.filter((c) => c.status === "fail").length,
        ),
        warnCount: pick(
          safe,
          (s) => s.checks.filter((c) => c.status === "warn").length,
        ),
      },

      stage: {
        ageMs: pick(stats, (s) => s.ageMs),
        marketCapUsd: pick(stats, (s) => s.marketCapUsd),
        fdvUsd: pick(stats, (s) => s.fdvUsd),
        mcapToFdv: pick(stats, (s) => mcapToFdv(s.marketCapUsd, s.fdvUsd)),
        athDrawdownPercent: pick(stats, (s) =>
          s.athPriceUsd && s.athPriceUsd > 0
            ? Math.max(0, ((s.athPriceUsd - s.priceUsd) / s.athPriceUsd) * 100)
            : null,
        ),
        holderTrend: pick(hold, (s) => ({
          current: s.holderCount,
          delta24hPercent:
            s.holderCountPrev24h != null
              ? holderDeltaPercent(s.holderCount, s.holderCountPrev24h)
              : null,
          delta7dPercent:
            s.holderCountPrev7d != null
              ? holderDeltaPercent(s.holderCount, s.holderCountPrev7d)
              : null,
        })),
      },

      flow: {
        volumeToLiquidity: pick(stats, (s) =>
          volumeToLiquidity(s.volume24hUsd, s.liquidityUsd),
        ),
        windows: pick(fl, (s) => s.windows),
        tradeSizeDistribution: pick(fl, (s) => s.tradeSizeDistribution),
      },

      crowd: {
        topHolders:
          hold.snapshot || safe.snapshot
            ? {
                value: topHolders,
                status: (hold.snapshot ? hold : safe).status,
                source: (hold.snapshot ? hold : safe).source,
                lastUpdatedAt: (hold.snapshot ? hold : safe).lastUpdatedAt,
              }
            : {
                value: null,
                status: UNAVAILABLE,
                source: hold.source,
                lastUpdatedAt: null,
              },
        top10Percent: pick(hold, (s) =>
          top10PercentExcludingLpBurn(s.holders, lpAddresses),
        ),
        sniperSharePercent: pick(hold, (s) =>
          sniperSharePercent(s.holders, s.sniperWallets),
        ),
        nakhoda: pick(nak, (s) => s.flow),
      },
    };

    return ok(insights);
  }
}
