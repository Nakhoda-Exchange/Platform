import type { Portfolio } from "@/lib/core/domain/portfolio/portfolio";
import { parsePrice } from "@/lib/core/domain/market/price";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { PortfolioRepository } from "../ports/portfolio-repository.port";

/**
 * Returns the portfolio with everything the wallet home answers: how much
 * money the user has (cash + holdings, computed here — the source of truth)
 * and how much profit they made (all-time Σ(value − cost) plus the 24h P&L
 * derived from each coin's change).
 */
export class GetPortfolioUseCase {
  constructor(private readonly portfolio: PortfolioRepository) {}

  async execute(): Promise<Result<Portfolio>> {
    const result = await this.portfolio.getPortfolio();
    if (!result.ok) return result;

    const { holdings, availableIrt, pendingWithdrawIrt } = result.data;
    // Money fields arrive as decimal STRINGS (numeric(38,18)); parse before any
    // arithmetic. `parsePrice` also maps a missing/malformed field to null, so
    // `?? 0` keeps one bad holding from turning the whole total (and «سود کل»)
    // into NaN — the same guard the old finite-check gave.
    const num = (v: string | number) => parsePrice(v) ?? 0;
    const holdingsValueIrt = holdings.reduce(
      (sum, h) => sum + num(h.valueIrt),
      0,
    );
    const costIrt = holdings.reduce((sum, h) => sum + num(h.costIrt), 0);
    const profitIrt = holdingsValueIrt - costIrt;
    const profitPercent = costIrt > 0 ? (profitIrt / costIrt) * 100 : 0;
    const dayChangeIrt = holdings.reduce(
      (sum, h) => sum + (num(h.valueIrt) * h.coin.change24h) / 100,
      0,
    );
    const dayChangePercent =
      holdingsValueIrt > 0 ? (dayChangeIrt / holdingsValueIrt) * 100 : 0;

    // availableIrt/pendingWithdrawIrt are wire strings; normalize to numbers for
    // the computed Portfolio (its consumers do math/comparisons on them).
    const availableIrtNum = num(availableIrt);
    return ok({
      totalIrt: availableIrtNum + holdingsValueIrt,
      availableIrt: availableIrtNum,
      pendingWithdrawIrt: num(pendingWithdrawIrt),
      holdingsValueIrt,
      profitIrt,
      profitPercent,
      dayChangeIrt,
      dayChangePercent,
      holdings,
    });
  }
}
