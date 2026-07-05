/** Ranges for the account-value history chart (NOT the market ChartRange). */
export type PortfolioHistoryRange = "daily" | "weekly" | "monthly";

export const PORTFOLIO_HISTORY_RANGES: readonly PortfolioHistoryRange[] = [
  "daily",
  "weekly",
  "monthly",
];

/**
 * One point of total account value. `at` is epoch ms — deliberately not a
 * Date, so the payload crosses server → client props untouched.
 */
export interface PortfolioValuePoint {
  at: number; // epoch ms
  valueIrt: number; // total account value (cash + holdings), Toman
}

/** All ranges at once, each oldest → newest; last point = current total. */
export type PortfolioHistory = Record<
  PortfolioHistoryRange,
  PortfolioValuePoint[]
>;
