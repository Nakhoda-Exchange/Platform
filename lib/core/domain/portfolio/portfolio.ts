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
  costIrt: number; // what was paid for this position, in Toman (cost basis)
}

/** The user's portfolio overview. */
export interface Portfolio {
  totalIrt: number; // everything: cash + holdings value
  availableIrt: number; // cash balance, Toman
  pendingWithdrawIrt: number; // reserved by in-review withdrawals, Toman
  holdingsValueIrt: number; // sum of holdings' valueIrt
  profitIrt: number; // all-time P&L: Σ(value − cost), Toman
  profitPercent: number; // profitIrt as a percent of Σcost
  dayChangeIrt: number; // 24h P&L in Toman
  dayChangePercent: number; // 24h P&L as a percent of holdings value
  holdings: Holding[];
}
