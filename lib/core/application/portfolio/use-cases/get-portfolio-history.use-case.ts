import {
  PORTFOLIO_HISTORY_RANGES,
  type PortfolioHistory,
} from "@/lib/core/domain/portfolio/portfolio-history";
import { fail, ok, type Result } from "@/lib/core/domain/shared/result";
import type { PortfolioRepository } from "../ports/portfolio-repository.port";

/**
 * Account-value history for the details-sheet chart. The use case is the
 * source of truth for consistency: each range is sorted ascending and its
 * last point is pinned to the LIVE total (cash + holdings, same math as
 * GetPortfolioUseCase), so the chart's «latest» always equals «دارایی کل» —
 * even right after a trade or withdrawal.
 */
export class GetPortfolioHistoryUseCase {
  constructor(private readonly portfolio: PortfolioRepository) {}

  async execute(): Promise<Result<PortfolioHistory>> {
    const [historyResult, snapshotResult] = await Promise.all([
      this.portfolio.getPortfolioHistory(),
      this.portfolio.getPortfolio(),
    ]);
    if (!historyResult.ok) return historyResult;
    if (!snapshotResult.ok) return snapshotResult;

    const { availableIrt, holdings } = snapshotResult.data;
    const totalIrt =
      availableIrt + holdings.reduce((sum, h) => sum + h.valueIrt, 0);

    const history = {} as PortfolioHistory;
    for (const range of PORTFOLIO_HISTORY_RANGES) {
      const points = [...(historyResult.data[range] ?? [])];
      if (points.length === 0) {
        return fail("portfolio/empty-history", "تاریخچه دارایی در دسترس نیست.");
      }
      points.sort((a, b) => a.at - b.at);
      const last = points[points.length - 1];
      points[points.length - 1] = { at: last.at, valueIrt: totalIrt };
      history[range] = points;
    }
    return ok(history);
  }
}
