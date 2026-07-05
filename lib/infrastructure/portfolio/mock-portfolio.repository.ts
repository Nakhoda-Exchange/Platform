import type {
  PortfolioRepository,
  PortfolioSnapshot,
} from "@/lib/core/application/portfolio/ports/portfolio-repository.port";
import { ok, type Result } from "@/lib/core/domain/shared/result";
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
}
