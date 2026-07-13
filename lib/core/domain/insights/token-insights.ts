/**
 * TokenInsights — the ONE normalized shape the PDP (and the market screener)
 * consume, regardless of chain or provider. Provider names never reach the UI
 * as branching logic; they appear only as a `source` label carried in the data
 * for attribution. Every surfaced value is a `Metric<T>` so the UI can show
 * freshness, attribute a source, and degrade gracefully when a provider is
 * down — a missing metric is `unavailable`, NEVER fabricated or interpolated.
 */

import type { TokenIdentity } from "@/lib/core/domain/shared/token-identity";

export type {
  Chain,
  TokenIdentity,
} from "@/lib/core/domain/shared/token-identity";

/**
 * Provenance label — attribution only. UI renders it ("منبع: RugCheck") but
 * never switches behaviour on it. `derived` = computed by our own domain math;
 * `nakhoda` = from our own order flow.
 */
export type Source =
  | "dexscreener"
  | "birdeye"
  | "rugcheck"
  | "helius"
  | "moralis"
  | "goplus"
  | "nakhoda"
  | "derived";

/** ok = fresh; stale = served past its soft TTL; unavailable = provider failed. */
export type MetricStatus = "ok" | "stale" | "unavailable";

/** A single value plus its freshness and provenance. `value` is null unless ok/stale. */
export interface Metric<T> {
  value: T | null;
  status: MetricStatus;
  source: Source;
  lastUpdatedAt: number | null; // epoch ms of the underlying fetch
}

// ── Panel 1 — «می‌تونم خارج بشم؟» (liquidity / exit) ────────────────────────
export interface LpStatus {
  lockedPercent: number | null;
  burnedPercent: number | null;
  lockedUntil: number | null; // epoch ms if time-locked
}
/** Price impact of a trade of `sizeIrt` Toman, from the liquidity curve. */
export interface PriceImpactPoint {
  sizeIrt: number;
  impactPercent: number; // >= 0, magnitude of adverse move
}
export interface ExitInsights {
  liquidityUsd: Metric<number>;
  liquidityToMcap: Metric<number>; // derived
  lp: Metric<LpStatus>;
  priceImpact: Metric<PriceImpactPoint[]>; // at representative sizes
}

// ── Panel 2 — «ریسک کلاهبرداری» (safety, EXPLAINABLE) ───────────────────────
export type CheckStatus = "pass" | "warn" | "fail" | "unknown";
/** One named safety check — the panel is a LIST of these, never a single tick. */
export interface SafetyCheck {
  id: string; // stable, e.g. "mint_authority"
  label: string; // Persian
  status: CheckStatus;
  detail: string; // neutral, factual — no advice
  source: Source;
  lastUpdatedAt: number | null;
}
export interface SafetyInsights {
  checks: SafetyCheck[];
  failCount: Metric<number>; // derived from checks
  warnCount: Metric<number>;
}

// ── Panel 3 — «زود رسیدم یا دیر؟» (stage) ───────────────────────────────────
export interface HolderTrend {
  current: number;
  delta24hPercent: number | null;
  delta7dPercent: number | null;
}
export interface StageInsights {
  ageMs: Metric<number>; // since launch / first seen
  marketCapUsd: Metric<number>;
  fdvUsd: Metric<number>;
  mcapToFdv: Metric<number>; // derived
  athDrawdownPercent: Metric<number>; // % below all-time high
  holderTrend: Metric<HolderTrend>;
}

// ── Panel 4 — «حجم واقعیه؟» (flow quality) ──────────────────────────────────
export type FlowWindow = "5m" | "1h" | "6h" | "24h";
export interface WindowFlow {
  window: FlowWindow;
  uniqueBuyers: number; // distinct WALLETS, not tx count
  uniqueSellers: number;
  buys: number; // tx counts, for context
  sells: number;
}
export interface TradeSizeBucket {
  label: string; // e.g. «< ۱۰۰ دلار»
  share: number; // fraction of volume in [0,1]
}
export interface FlowInsights {
  volumeToLiquidity: Metric<number>; // derived — wash-trading signal
  windows: Metric<WindowFlow[]>;
  tradeSizeDistribution: Metric<TradeSizeBucket[]>;
}

// ── Panel 5 — «جمعیت چه می‌کنه؟» (crowd + Nakhoda-native) ────────────────────
export interface TopHolder {
  address: string;
  percent: number;
  isContract: boolean;
  label: string | null; // known-entity label, if any
}
/** Metrics from our OWN order flow — nobody else has these. */
export interface NakhodaFlow {
  holdersInProfitPercent: number | null;
  buySellRatio: number | null;
  watchlistVelocityPerHour: number | null;
}
export interface CrowdInsights {
  topHolders: Metric<TopHolder[]>;
  top10Percent: Metric<number>; // derived, EXCLUDING LP pools + burn addresses
  sniperSharePercent: Metric<number>; // % held by first-N-seconds buyers
  nakhoda: Metric<NakhodaFlow>;
}

/** The one normalized object the UI consumes. */
export interface TokenInsights {
  token: TokenIdentity;
  exit: ExitInsights;
  safety: SafetyInsights;
  stage: StageInsights;
  flow: FlowInsights;
  crowd: CrowdInsights;
  generatedAt: number; // epoch ms of assembly
}
