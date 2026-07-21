import type { Coin } from "@/lib/core/domain/market/coin";

export type TradeSide = "buy" | "sell";

/**
 * Last-resort smallest order the platform accepts, in Toman. Used only OFFLINE —
 * when the backend serves neither a per-token min NOR the admin-configurable
 * global floor (`defaultMinIrt`, GET /v1/trade/limits). Resolution order is
 * per-token min → API global floor → this constant (see {@link minOrderIrt}).
 */
export const MIN_ORDER_IRT = 500_000;

/**
 * Per-token order-size bounds as IRT notional (whole Toman), from the backend
 * `GET /v1/trade/limits`. `null` means "unbounded on that side" — fall back to
 * {@link MIN_ORDER_IRT} for a missing min, and to the balance cap for a missing
 * max. Buy and sell can differ, so they are held separately.
 */
export interface TokenTradeLimits {
  minBuyIrt: number | null;
  maxBuyIrt: number | null;
  minSellIrt: number | null;
  maxSellIrt: number | null;
}

/**
 * The effective minimum order (Toman) for a side. Resolution order: the
 * per-token min (authoritative when set) → the admin-configurable global floor
 * (`defaultMinIrt`, from GET /v1/trade/limits) → the offline {@link MIN_ORDER_IRT}
 * constant. Pass `defaultMinIrt` (already parsed to a number, or null/undefined
 * when the API omits it) from the trade context / limits payload.
 */
export function minOrderIrt(
  limits: TokenTradeLimits | undefined,
  side: TradeSide,
  defaultMinIrt?: number | null,
): number {
  const perToken = side === "buy" ? limits?.minBuyIrt : limits?.minSellIrt;
  return perToken ?? defaultMinIrt ?? MIN_ORDER_IRT;
}

/** The per-token maximum order (Toman) for a side, or null when the backend sets none. */
export function maxOrderIrt(
  limits: TokenTradeLimits | undefined,
  side: TradeSide,
): number | null {
  return (side === "buy" ? limits?.maxBuyIrt : limits?.maxSellIrt) ?? null;
}

/**
 * Market-order fee (0.35%, competitive with Nobitex/Wallex). The revenue
 * engine the referral program shares — see doc/referral/PRD.md.
 */
export const FEE_RATE = 0.0035;

/** Everything the trade screen needs to open for a coin. */
export interface TradeContext {
  coin: Coin;
  availableIrt: number; // cash balance, Toman
  availableCoin: number; // units of this coin held (0 if none)
  limits: TokenTradeLimits; // per-token min/max bounds (nulls when unbounded)
  // Admin-configurable global minimum order (whole Toman) from the API; the
  // floor when this token has no per-token min. `null` when the API omits it
  // (→ the offline MIN_ORDER_IRT fallback). See {@link minOrderIrt}.
  defaultMinIrt: number | null;
}

/** A successfully placed (mock) market order. */
export interface PlacedOrder {
  id: string;
  side: TradeSide;
  coinId: string;
  symbol: string;
  name: string; // Persian coin name for the receipt
  amountCoin: number; // units bought/sold
  totalIrt: number; // total value, Toman (what the user entered)
  feeIrt: number; // platform fee charged, Toman
  priceIrt: number; // unit price at execution, Toman
}
