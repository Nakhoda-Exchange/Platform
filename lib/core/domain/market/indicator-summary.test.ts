import { describe, expect, test } from "bun:test";
import type { ChartRange, PricePoint } from "./coin-detail";
import { summarizeIndicators } from "./indicator-summary";

const rising = (n: number): PricePoint[] =>
  Array.from({ length: n }, (_, i) => ({ at: i, priceIrt: 100 + i * 10 }));
const falling = (n: number): PricePoint[] =>
  Array.from({ length: n }, (_, i) => ({ at: i, priceIrt: 1_000 - i * 10 }));

const seriesOf = (points: PricePoint[]): Record<ChartRange, PricePoint[]> => ({
  "24h": points,
  "7d": points,
  "1m": points,
  "1y": points,
});

describe("summarizeIndicators", () => {
  test("everything rising → buy with all signals up", () => {
    const s = summarizeIndicators(3.2, seriesOf(rising(10)));
    expect(s).toEqual({ verdict: "buy", positives: 5, total: 5 });
  });

  test("everything falling → sell", () => {
    const s = summarizeIndicators(-2.5, seriesOf(falling(10)));
    expect(s.verdict).toBe("sell");
    expect(s.positives).toBeLessThanOrEqual(1);
  });

  test("mixed picture → hold", () => {
    // 24h down, but the week/month trended up.
    const s = summarizeIndicators(-1.9, {
      "24h": falling(10),
      "7d": rising(10),
      "1m": falling(10),
      "1y": rising(10),
    });
    expect(s.verdict).toBe("hold");
  });

  test("too little data → hold, zero of zero (no fake confidence)", () => {
    const s = summarizeIndicators(1, seriesOf([{ at: 0, priceIrt: 100 }]));
    expect(s).toEqual({ verdict: "hold", positives: 0, total: 0 });
  });
});
