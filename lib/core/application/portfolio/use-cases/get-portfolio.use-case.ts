import type { Portfolio } from "@/lib/core/domain/portfolio/portfolio";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { PortfolioRepository } from "../ports/portfolio-repository.port";

/**
 * Returns the portfolio with the total value computed as the sum of holdings
 * (the source of truth) and the 24h P&L derived from each coin's change.
 */
export class GetPortfolioUseCase {
  constructor(private readonly portfolio: PortfolioRepository) {}

  async execute(): Promise<Result<Portfolio>> {
    const result = await this.portfolio.getPortfolio();
    if (!result.ok) return result;

    const { holdings } = result.data;
    const totalValueIrt = holdings.reduce((sum, h) => sum + h.valueIrt, 0);
    const dayChangeIrt = holdings.reduce(
      (sum, h) => sum + (h.valueIrt * h.coin.change24h) / 100,
      0,
    );
    const dayChangePercent =
      totalValueIrt > 0 ? (dayChangeIrt / totalValueIrt) * 100 : 0;

    return ok({ totalValueIrt, dayChangeIrt, dayChangePercent, holdings });
  }
}
