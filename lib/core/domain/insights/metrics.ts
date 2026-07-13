/**
 * Pure derived-metric math for TokenInsights. No I/O — providers hand raw
 * numbers/rows in, these compute the values we actually show. Everything here
 * is unit-tested (metrics.test.ts); the emphasis is the LP/burn-exclusion and
 * the unique-WALLET counts, both easy to get subtly wrong.
 *
 * Address handling is chain-aware: EVM addresses are case-insensitive hex, so
 * we lowercase them; Solana addresses are case-sensitive base58, so we must NOT
 * — lowercasing a mint would silently break burn/LP/sniper matching.
 */

import type { PriceImpactPoint } from "./token-insights";

/** Well-known burn / dead / null addresses: they hold supply but aren't holders. */
export const BURN_ADDRESSES: readonly string[] = [
  // EVM (compared lowercase)
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dead",
  "0xdead000000000000000042069420694206942069",
  // Solana (compared exact — case-sensitive base58)
  "1nc1nerator11111111111111111111111111111111",
  "11111111111111111111111111111111",
];

/** The Toman trade sizes the PDP shows price impact for. */
export const REPRESENTATIVE_TRADE_SIZES_IRT: readonly number[] = [
  10_000_000, 100_000_000, 1_000_000_000,
];

/** Normalize an address for comparison: lowercase EVM (0x…), leave Solana as-is. */
export function normalizeAddress(address: string): string {
  const a = address.trim();
  return a.startsWith("0x") ? a.toLowerCase() : a;
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/** Safe ratio: null when denominator is non-positive or inputs aren't finite. */
export function safeRatio(
  numerator: number,
  denominator: number,
): number | null {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return null;
  }
  return round(numerator / denominator, 4);
}

export const liquidityToMcap = (
  liqUsd: number,
  mcapUsd: number,
): number | null => safeRatio(liqUsd, mcapUsd);

export const volumeToLiquidity = (
  volUsd: number,
  liqUsd: number,
): number | null => safeRatio(volUsd, liqUsd);

export const mcapToFdv = (mcapUsd: number, fdvUsd: number): number | null =>
  safeRatio(mcapUsd, fdvUsd);

/** Percent change in holder count vs a prior snapshot; null if no baseline. */
export function holderDeltaPercent(
  current: number,
  previous: number,
): number | null {
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    previous <= 0
  ) {
    return null;
  }
  return round(((current - previous) / previous) * 100, 2);
}

/** Our own buy/sell ratio; null when there are no sells (avoid /0 and ∞). */
export function buySellRatio(buys: number, sells: number): number | null {
  if (!Number.isFinite(buys) || !Number.isFinite(sells) || sells <= 0) {
    return null;
  }
  return round(buys / sells, 2);
}

export interface HolderPercent {
  address: string;
  percent: number;
}

/**
 * Top-10 holder concentration EXCLUDING LP pools and burn addresses — the raw
 * top-10 is misleading because the biggest "holder" is usually the DEX pool.
 * Pass the token's LP/pool addresses; known burn addresses are excluded here.
 * Returns null only when there are no holders at all.
 */
export function top10PercentExcludingLpBurn(
  holders: readonly HolderPercent[],
  lpAddresses: readonly string[] = [],
): number | null {
  if (holders.length === 0) return null;
  const excluded = new Set(
    [...lpAddresses, ...BURN_ADDRESSES].map(normalizeAddress),
  );
  const realPercents = holders
    .filter((h) => !excluded.has(normalizeAddress(h.address)))
    .map((h) => h.percent)
    .filter((p) => Number.isFinite(p) && p > 0)
    .sort((a, b) => b - a);
  const top10 = realPercents.slice(0, 10).reduce((sum, p) => sum + p, 0);
  return round(top10);
}

/**
 * Share of supply held by "sniper" wallets — those that bought in the first N
 * seconds. Sums the CURRENT holdings of the given sniper wallets.
 */
export function sniperSharePercent(
  holders: readonly HolderPercent[],
  sniperWallets: readonly string[],
): number | null {
  if (holders.length === 0) return null;
  const snipers = new Set(sniperWallets.map(normalizeAddress));
  const total = holders
    .filter((h) => snipers.has(normalizeAddress(h.address)))
    .reduce((sum, h) => sum + (Number.isFinite(h.percent) ? h.percent : 0), 0);
  return round(total);
}

export interface RawTrade {
  wallet: string;
  side: "buy" | "sell";
}

export interface WalletFlowCounts {
  uniqueBuyers: number;
  uniqueSellers: number;
  buys: number;
  sells: number;
}

/**
 * Unique BUYERS vs SELLERS over a window — distinct wallets, NOT transaction
 * counts (which are trivially botted: one wallet looping 500 buys is 1 buyer).
 * `buys`/`sells` keep the raw tx counts for context.
 */
export function uniqueWalletCounts(
  trades: readonly RawTrade[],
): WalletFlowCounts {
  const buyers = new Set<string>();
  const sellers = new Set<string>();
  let buys = 0;
  let sells = 0;
  for (const t of trades) {
    const wallet = normalizeAddress(t.wallet);
    if (t.side === "buy") {
      buyers.add(wallet);
      buys += 1;
    } else {
      sellers.add(wallet);
      sells += 1;
    }
  }
  return {
    uniqueBuyers: buyers.size,
    uniqueSellers: sellers.size,
    buys,
    sells,
  };
}

/**
 * Adverse price impact of a `sizeIrt` buy, from a constant-product (xy=k) pool
 * whose total liquidity (both sides) is `liquidityIrt`, so the quote reserve is
 * ~half. Approximation for display/relative comparison, not execution pricing.
 */
export function priceImpactPercent(
  sizeIrt: number,
  liquidityIrt: number,
): number | null {
  if (
    !Number.isFinite(sizeIrt) ||
    !Number.isFinite(liquidityIrt) ||
    liquidityIrt <= 0 ||
    sizeIrt <= 0
  ) {
    return null;
  }
  const quoteReserve = liquidityIrt / 2;
  return round((sizeIrt / (quoteReserve + sizeIrt)) * 100, 2);
}

/** Price-impact curve at the representative sizes; null if liquidity unknown. */
export function priceImpactCurve(
  liquidityIrt: number,
  sizesIrt: readonly number[] = REPRESENTATIVE_TRADE_SIZES_IRT,
): PriceImpactPoint[] | null {
  if (!Number.isFinite(liquidityIrt) || liquidityIrt <= 0) return null;
  return sizesIrt.map((sizeIrt) => ({
    sizeIrt,
    impactPercent: priceImpactPercent(sizeIrt, liquidityIrt) ?? 0,
  }));
}
