import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import type { Result } from "@/lib/core/domain/shared/result";

/** A portfolio snapshot from the backend: holdings + the total it reports. */
export interface PortfolioSnapshot {
  totalValueIrt: number;
  holdings: Holding[];
}

/** Port for the user's portfolio. Concrete adapters live in infrastructure. */
export interface PortfolioRepository {
  getPortfolio(): Promise<Result<PortfolioSnapshot>>;
}
