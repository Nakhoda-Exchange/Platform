import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import type { PortfolioHistory } from "@/lib/core/domain/portfolio/portfolio-history";
import type { Result } from "@/lib/core/domain/shared/result";

/**
 * A portfolio snapshot from the backend: cash + holdings. Money fields are
 * decimal STRINGS on the wire (exact `numeric(38,18)`); parse with `parsePrice`
 * before arithmetic. The use case normalizes these into the computed
 * `Portfolio` (numbers) — see GetPortfolioUseCase.
 */
export interface PortfolioSnapshot {
  availableIrt: string; // cash balance, Toman (decimal string)
  pendingWithdrawIrt: string; // reserved by in-review withdrawals, Toman (decimal string)
  holdings: Holding[];
}

/** Port for the user's portfolio. Concrete adapters live in infrastructure. */
export interface PortfolioRepository {
  getPortfolio(): Promise<Result<PortfolioSnapshot>>;
  /** Account-value history for all chart ranges, each oldest → newest. */
  getPortfolioHistory(): Promise<Result<PortfolioHistory>>;
}
