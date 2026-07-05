import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import type { Result } from "@/lib/core/domain/shared/result";

/** A portfolio snapshot from the backend: cash + holdings. */
export interface PortfolioSnapshot {
  availableIrt: number; // cash balance, Toman
  pendingWithdrawIrt: number; // reserved by in-review withdrawals, Toman
  holdings: Holding[];
}

/** Port for the user's portfolio. Concrete adapters live in infrastructure. */
export interface PortfolioRepository {
  getPortfolio(): Promise<Result<PortfolioSnapshot>>;
}
