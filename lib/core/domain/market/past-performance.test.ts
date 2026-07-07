import { describe, expect, test } from "bun:test";
import type { ChartRange, PricePoint } from "./coin-detail";
import { pastPerformance } from "./past-performance";

const points = (...prices: number[]): PricePoint[] =>
  prices.map((priceIrt, i) => ({ at: i, priceIrt }));

const seriesOf = (
  overrides: Partial<Record<ChartRange, PricePoint[]>>,
): Record<ChartRange, PricePoint[]> => ({
  "24h": points(100, 110),
  "7d": points(100, 90),
  "1m": points(200, 300),
  "1y": points(50, 40),
  ...overrides,
});

describe("pastPerformance", () => {
  test("computes the signed end-over-start move per range", () => {
    const perf = pastPerformance(seriesOf({}));
    expect(perf).toEqual([
      { range: "24h", changePercent: 10 },
      { range: "7d", changePercent: -10 },
      { range: "1m", changePercent: 50 },
      { range: "1y", changePercent: -20 },
    ]);
  });

  test("skips ranges without enough data instead of faking a zero", () => {
    const perf = pastPerformance(seriesOf({ "1y": points(100) }));
    expect(perf.map((p) => p.range)).toEqual(["24h", "7d", "1m"]);
  });
});
