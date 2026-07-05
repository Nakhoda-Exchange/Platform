import type { Coin } from "@/lib/core/domain/market/coin";

export type TradeSide = "buy" | "sell";

/** Smallest order the platform accepts, in Toman. */
export const MIN_ORDER_IRT = 500_000;

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
