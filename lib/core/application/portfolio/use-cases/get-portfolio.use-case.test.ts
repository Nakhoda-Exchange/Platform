import { describe, expect, test } from "bun:test";
import { ok } from "@/lib/core/domain/shared/result";
import type {
  PortfolioRepository,
  PortfolioSnapshot,
} from "../ports/portfolio-repository.port";
import { GetPortfolioUseCase } from "./get-portfolio.use-case";

function repoOf(snapshot: PortfolioSnapshot): PortfolioRepository {
  return { getPortfolio: async () => ok(snapshot) };
}

const coin = (change24h: number) => ({
  id: "x",
  name: "x",
  symbol: "X",
  iconUrl: "",
  change24h,
});

describe("GetPortfolioUseCase", () => {
  test("total value = sum of holdings (ignores a wrong reported total)", async () => {
    const uc = new GetPortfolioUseCase(
      repoOf({
        totalValueIrt: 999, // wrong on purpose
        holdings: [
          { coin: coin(10), amount: 1, valueIrt: 100 },
          { coin: coin(-5), amount: 1, valueIrt: 200 },
        ],
      }),
    );
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.totalValueIrt).toBe(300);
  });

  test("derives 24h P&L from each coin's change", async () => {
    const uc = new GetPortfolioUseCase(
      repoOf({
        totalValueIrt: 0,
        holdings: [
          { coin: coin(10), amount: 1, valueIrt: 100 }, // +10
          { coin: coin(-5), amount: 1, valueIrt: 200 }, // -10
        ],
      }),
    );
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.dayChangeIrt).toBe(0);
      expect(result.data.dayChangePercent).toBe(0);
    }
  });

  test("empty portfolio → zero total, no divide-by-zero", async () => {
    const uc = new GetPortfolioUseCase(
      repoOf({ totalValueIrt: 0, holdings: [] }),
    );
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalValueIrt).toBe(0);
      expect(result.data.dayChangePercent).toBe(0);
    }
  });
});
