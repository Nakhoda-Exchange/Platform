import type { Coin } from "@/lib/core/domain/market/coin";

/** The coin fields a holding needs (icon, name, symbol, 24h change). */
export type HoldingCoin = Pick<
  Coin,
  "id" | "name" | "symbol" | "iconUrl" | "change24h"
>;

/** One position in the portfolio: a coin, the amount held, and its Toman value. */
export interface Holding {
  coin: HoldingCoin;
  amount: number; // units of the coin held
  valueIrt: number; // amount × price, in Toman
}

/** The user's portfolio overview. */
export interface Portfolio {
  totalValueIrt: number; // sum of holdings' valueIrt
  dayChangeIrt: number; // 24h P&L in Toman
  dayChangePercent: number; // 24h P&L as a percent of total value
  holdings: Holding[];
}
