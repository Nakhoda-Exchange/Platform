/** Ranges for the account-value history chart (NOT the market ChartRange). */
export type PortfolioHistoryRange = "daily" | "weekly" | "monthly";

export const PORTFOLIO_HISTORY_RANGES: readonly PortfolioHistoryRange[] = [
  "daily",
  "weekly",
  "monthly",
];

/** A cash movement that visibly steps the account value at one point. */
export interface PortfolioValueEvent {
  type: "deposit" | "withdraw";
  amountIrt: string; // Toman, always positive (decimal string on the wire)
}

/**
 * One point of total account value. `at` is epoch ms — deliberately not a
 * Date, so the payload crosses server → client props untouched.
 */
export interface PortfolioValuePoint {
  at: number; // epoch ms
  valueIrt: string; // total account value (cash + holdings), Toman (decimal string)
  event?: PortfolioValueEvent; // set when a deposit/withdraw landed here
}

/** All ranges at once, each oldest → newest; last point = current total. */
export type PortfolioHistory = Record<
  PortfolioHistoryRange,
  PortfolioValuePoint[]
>;
