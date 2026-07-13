/**
 * Ports for the token-insights layer.
 *
 * Providers are split by CAPABILITY, not by vendor, so each is independently
 * swappable and the chain→provider routing stays a lookup. Each capability
 * provider returns a raw, provider-agnostic SNAPSHOT (the inputs to our domain
 * math). The `TokenInsightsService` (infrastructure) fetches snapshots, runs
 * the derived math, and assembles the one normalized `TokenInsights` — so the
 * math lives in the domain and vendor DTOs never escape a provider.
 */

import type { Result } from "@/lib/core/domain/shared/result";
import type { TokenIdentity } from "@/lib/core/domain/shared/token-identity";
import type { HolderPercent } from "@/lib/core/domain/insights/metrics";
import type {
  LpStatus,
  NakhodaFlow,
  SafetyCheck,
  Source,
  TokenInsights,
  TopHolder,
  TradeSizeBucket,
  WindowFlow,
} from "@/lib/core/domain/insights/token-insights";

/** Every snapshot stamps the provider that produced it and when it was fetched. */
interface SnapshotMeta {
  source: Source;
  fetchedAt: number; // epoch ms
}

/** Price / market stats + liquidity (one DexScreener-style call covers these). */
export interface MarketStatsSnapshot extends SnapshotMeta {
  priceUsd: number;
  marketCapUsd: number;
  fdvUsd: number;
  volume24hUsd: number;
  liquidityUsd: number;
  ageMs: number; // since pair creation
  athPriceUsd: number | null; // null when the provider doesn't supply it
}

/** Safety report — the explainable checks, plus LP status and concentration a
 *  security provider typically returns in the same call. */
export interface SafetySnapshot extends SnapshotMeta {
  checks: SafetyCheck[];
  lp: LpStatus;
  topHolders: TopHolder[]; // may be empty if not provided
  holderCount: number | null;
}

/** Holder distribution + the wallets our concentration/sniper math needs. */
export interface HoldersSnapshot extends SnapshotMeta {
  holders: HolderPercent[]; // top holders with supply %
  topHolders: TopHolder[]; // richer holder rows for the crowd panel
  holderCount: number;
  holderCountPrev24h: number | null;
  holderCountPrev7d: number | null;
  lpAddresses: string[]; // pool addresses to exclude from top-10
  sniperWallets: string[]; // wallets that bought in the first N seconds
}

/** Trade flow per window + trade-size distribution. Providers give unique
 *  wallets where they can; where only trade lists exist, the adapter reduces
 *  them with the domain `uniqueWalletCounts`. */
export interface FlowSnapshot extends SnapshotMeta {
  windows: WindowFlow[];
  tradeSizeDistribution: TradeSizeBucket[];
}

/** Our own order-flow metrics (from portfolio/trade/watchlist repos). */
export interface NakhodaFlowSnapshot extends SnapshotMeta {
  flow: NakhodaFlow;
}

// ── Capability provider interfaces (each independently swappable) ────────────
export interface MarketStatsProvider {
  getMarketStats(token: TokenIdentity): Promise<Result<MarketStatsSnapshot>>;
}
export interface SafetyProvider {
  getSafety(token: TokenIdentity): Promise<Result<SafetySnapshot>>;
}
export interface HoldersProvider {
  getHolders(token: TokenIdentity): Promise<Result<HoldersSnapshot>>;
}
export interface TradeFlowProvider {
  getFlow(token: TokenIdentity): Promise<Result<FlowSnapshot>>;
}
export interface NakhodaFlowProvider {
  getNakhodaFlow(token: TokenIdentity): Promise<Result<NakhodaFlowSnapshot>>;
}

/**
 * The single service the use case depends on. One normalized shape out,
 * chain/provider-agnostic. A `null` result means the token has no on-chain
 * identity (majors) — the caller shows "not applicable", not an error.
 */
export interface TokenInsightsPort {
  /** `usdToIrt` converts the representative Toman trade sizes for the (currency-
   *  invariant) price-impact curve computed from USD liquidity. */
  getInsights(
    token: TokenIdentity,
    usdToIrt: number,
  ): Promise<Result<TokenInsights>>;
}
