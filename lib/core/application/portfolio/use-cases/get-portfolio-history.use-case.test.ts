import { describe, expect, test } from "bun:test";
import { fail, ok } from "@/lib/core/domain/shared/result";
import type { PortfolioHistory } from "@/lib/core/domain/portfolio/portfolio-history";
import type {
  PortfolioRepository,
  PortfolioSnapshot,
} from "../ports/portfolio-repository.port";
import { GetPortfolioHistoryUseCase } from "./get-portfolio-history.use-case";

const coin = {
  id: "x",
  name: "x",
  symbol: "X",
  iconUrl: "",
  change24h: 0,
};

const snapshot: PortfolioSnapshot = {
  availableIrt: 1_000,
  pendingWithdrawIrt: 0,
  holdings: [
    { coin, amount: 1, valueIrt: 300, costIrt: 250 },
    { coin, amount: 2, valueIrt: 200, costIrt: 180 },
  ],
}; // live total = 1_500

const history: PortfolioHistory = {
  daily: [
    { at: 1, valueIrt: 900 },
    { at: 2, valueIrt: 950 },
    { at: 3, valueIrt: 999 },
  ],
  weekly: [
    { at: 10, valueIrt: 800 },
    { at: 20, valueIrt: 900 },
  ],
  monthly: [
    { at: 100, valueIrt: 700 },
    { at: 200, valueIrt: 900 },
  ],
};

function repoOf(
  h: PortfolioHistory = history,
  s: PortfolioSnapshot = snapshot,
): PortfolioRepository {
  return {
    getPortfolio: async () => ok(s),
    getPortfolioHistory: async () => ok(h),
  };
}

describe("GetPortfolioHistoryUseCase", () => {
  test("returns all three ranges", async () => {
    const result = await new GetPortfolioHistoryUseCase(repoOf()).execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.daily).toHaveLength(3);
      expect(result.data.weekly).toHaveLength(2);
      expect(result.data.monthly).toHaveLength(2);
    }
  });

  test("pins the last point of every range to the live total", async () => {
    const result = await new GetPortfolioHistoryUseCase(repoOf()).execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.daily.at(-1)?.valueIrt).toBe(1_500);
      expect(result.data.weekly.at(-1)?.valueIrt).toBe(1_500);
      expect(result.data.monthly.at(-1)?.valueIrt).toBe(1_500);
      // Earlier points untouched.
      expect(result.data.daily[0].valueIrt).toBe(900);
    }
  });

  test("sorts out-of-order points ascending before pinning", async () => {
    const result = await new GetPortfolioHistoryUseCase(
      repoOf({
        ...history,
        daily: [
          { at: 3, valueIrt: 999 },
          { at: 1, valueIrt: 900 },
          { at: 2, valueIrt: 950 },
        ],
      }),
    ).execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.daily.map((p) => p.at)).toEqual([1, 2, 3]);
      expect(result.data.daily.at(-1)?.valueIrt).toBe(1_500); // newest pinned
    }
  });

  test("propagates a history fetch failure", async () => {
    const repo: PortfolioRepository = {
      getPortfolio: async () => ok(snapshot),
      getPortfolioHistory: async () => fail("x", "history down"),
    };
    const result = await new GetPortfolioHistoryUseCase(repo).execute();
    expect(result.ok).toBe(false);
  });

  test("propagates a snapshot fetch failure", async () => {
    const repo: PortfolioRepository = {
      getPortfolio: async () => fail("x", "snapshot down"),
      getPortfolioHistory: async () => ok(history),
    };
    const result = await new GetPortfolioHistoryUseCase(repo).execute();
    expect(result.ok).toBe(false);
  });

  test("an empty range fails instead of leaking NaN to the chart", async () => {
    const result = await new GetPortfolioHistoryUseCase(
      repoOf({ ...history, weekly: [] }),
    ).execute();
    expect(result.ok).toBe(false);
  });
});
