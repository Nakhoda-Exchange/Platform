import { describe, expect, test } from "bun:test";
import { ok } from "@/lib/core/domain/shared/result";
import type {
  PortfolioRepository,
  PortfolioSnapshot,
} from "../ports/portfolio-repository.port";
import { GetPortfolioUseCase } from "./get-portfolio.use-case";

function repoOf(snapshot: PortfolioSnapshot): PortfolioRepository {
  return {
    getPortfolio: async () => ok(snapshot),
    getPortfolioHistory: async () => ok({ daily: [], weekly: [], monthly: [] }),
  };
}

const coin = (change24h: number) => ({
  id: "x",
  name: "x",
  symbol: "X",
  iconUrl: "",
  change24h,
});

describe("GetPortfolioUseCase", () => {
  test("totals: holdings value is summed and cash is added on top", async () => {
    const uc = new GetPortfolioUseCase(
      repoOf({
        availableIrt: "1000",
        pendingWithdrawIrt: "0",
        holdings: [
          { coin: coin(10), amount: "1", valueIrt: "100", costIrt: "80" },
          { coin: coin(-5), amount: "1", valueIrt: "200", costIrt: "150" },
        ],
      }),
    );
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.holdingsValueIrt).toBe(300);
      expect(result.data.availableIrt).toBe(1_000);
      expect(result.data.totalIrt).toBe(1_300);
    }
  });

  test("all-time profit = Σ(value − cost), percent over cost", async () => {
    const uc = new GetPortfolioUseCase(
      repoOf({
        availableIrt: "0",
        pendingWithdrawIrt: "0",
        holdings: [
          { coin: coin(0), amount: "1", valueIrt: "150", costIrt: "100" }, // +50
          { coin: coin(0), amount: "1", valueIrt: "80", costIrt: "100" }, // −20
        ],
      }),
    );
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.profitIrt).toBe(30);
      expect(result.data.profitPercent).toBe(15); // 30 / 200
    }
  });

  test("24h P&L uses v·c/(100+c), not v·c/100; pending passes through", async () => {
    const uc = new GetPortfolioUseCase(
      repoOf({
        availableIrt: "0",
        pendingWithdrawIrt: "42",
        holdings: [
          // +50%: worth 100 a day ago, so the 24h gain is 50 (the wrong v·c/100
          // formula would say 75).
          { coin: coin(50), amount: "1", valueIrt: "150", costIrt: "150" },
          // +25%: worth 200 a day ago, so the 24h gain is 50 (wrong formula: 62.5).
          { coin: coin(25), amount: "1", valueIrt: "250", costIrt: "250" },
        ],
      }),
    );
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.dayChangeIrt).toBe(100); // 50 + 50, not 137.5
      expect(result.data.dayChangePercent).toBe(25); // 100 / 400
      expect(result.data.pendingWithdrawIrt).toBe(42);
    }
  });

  test("24h P&L understates nothing on a loss (v·c/(100+c))", async () => {
    const uc = new GetPortfolioUseCase(
      repoOf({
        availableIrt: "0",
        pendingWithdrawIrt: "0",
        // −50%: worth 100 a day ago, so the 24h loss is −50 (the wrong v·c/100
        // formula would say only −25).
        holdings: [
          { coin: coin(-50), amount: "1", valueIrt: "50", costIrt: "50" },
        ],
      }),
    );
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.dayChangeIrt).toBe(-50);
    }
  });

  test("a −100% change (worth nothing 24h ago) contributes 0, not ∞", async () => {
    const uc = new GetPortfolioUseCase(
      repoOf({
        availableIrt: "0",
        pendingWithdrawIrt: "0",
        holdings: [
          { coin: coin(-100), amount: "1", valueIrt: "10", costIrt: "10" },
        ],
      }),
    );
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.dayChangeIrt).toBe(0);
      expect(Number.isFinite(result.data.dayChangePercent)).toBe(true);
    }
  });

  test("empty portfolio yields zeros, not NaN", async () => {
    const uc = new GetPortfolioUseCase(
      repoOf({ availableIrt: "500", pendingWithdrawIrt: "0", holdings: [] }),
    );
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalIrt).toBe(500);
      expect(result.data.profitPercent).toBe(0);
      expect(result.data.dayChangePercent).toBe(0);
    }
  });
});
