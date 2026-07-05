import type {
  PortfolioRepository,
  PortfolioSnapshot,
} from "@/lib/core/application/portfolio/ports/portfolio-repository.port";
import type {
  PortfolioHistory,
  PortfolioValuePoint,
} from "@/lib/core/domain/portfolio/portfolio-history";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import { seededSeries } from "@/lib/infrastructure/shared/seeded-series";
import { wallet } from "./mock-wallet-state";

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reads the shared in-memory mock wallet (per-process), so mock trades placed
 * on the trade screen show up here too. Swap for an HTTP adapter in the
 * composition root when the backend lands. Empty the wallet's holdings in
 * mock-wallet-state.ts to preview the empty state.
 */
export class MockPortfolioRepository implements PortfolioRepository {
  async getPortfolio(): Promise<Result<PortfolioSnapshot>> {
    await delay();
    const pendingWithdrawIrt = wallet.transactions
      .filter((t) => t.type === "withdraw" && t.status === "pending")
      .reduce((sum, t) => sum + t.amountIrt, 0);
    return ok({
      availableIrt: wallet.irt,
      pendingWithdrawIrt,
      holdings: wallet.holdings,
    });
  }

  async getPortfolioHistory(): Promise<Result<PortfolioHistory>> {
    await delay();
    // Walks end at the LIVE total, so a mock trade re-pins the whole series.
    const total =
      wallet.irt + wallet.holdings.reduce((sum, h) => sum + h.valueIrt, 0);
    const end = Date.now();
    const toPoints = (
      values: number[],
      stepMs: number,
    ): PortfolioValuePoint[] =>
      values.map((v, i) => ({
        at: end - (values.length - 1 - i) * stepMs,
        valueIrt: Math.round(v),
      }));
    return ok({
      daily: toPoints(seededSeries(4102, 24, total, 0.02), 3_600_000),
      weekly: toPoints(seededSeries(4108, 28, total, 0.05), 21_600_000),
      monthly: toPoints(seededSeries(4131, 30, total, 0.12), 86_400_000),
    });
  }
}
