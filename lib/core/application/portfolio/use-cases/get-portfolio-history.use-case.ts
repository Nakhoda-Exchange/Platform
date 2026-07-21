import {
  PORTFOLIO_HISTORY_RANGES,
  type PortfolioHistory,
} from "@/lib/core/domain/portfolio/portfolio-history";
import { parsePrice } from "@/lib/core/domain/market/price";
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
    // Money fields are wire strings (numeric(38,18)); parse before summing.
    const num = (v: string | number) => parsePrice(v) ?? 0;
    const totalIrt =
      num(availableIrt) + holdings.reduce((sum, h) => sum + num(h.valueIrt), 0);

    const history = {} as PortfolioHistory;
    for (const range of PORTFOLIO_HISTORY_RANGES) {
      const points = [...(historyResult.data[range] ?? [])];
      if (points.length === 0) {
        return fail("portfolio/empty-history", "تاریخچه دارایی در دسترس نیست.");
      }
      points.sort((a, b) => a.at - b.at);
      const last = points[points.length - 1];
      // valueIrt is a decimal string on the wire; keep the pinned latest in the
      // same shape.
      points[points.length - 1] = { ...last, valueIrt: String(totalIrt) };
      history[range] = points;
    }
    return ok(history);
  }
}
