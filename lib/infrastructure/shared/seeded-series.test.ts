import { describe, expect, test } from "bun:test";
import { seededSeries, toCandles } from "./seeded-series";

describe("toCandles", () => {
  test("buckets a walk into OHLC with sound invariants", () => {
    const walk = seededSeries(7, 96, 1_000_000, 0.05);
    const candles = toCandles(walk, 4);
    expect(candles.length).toBe(24);
    expect(candles[0].open).toBe(walk[0]);
    expect(candles[23].close).toBe(1_000_000); // pinned to the current price
    for (const c of candles) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
    }
  });

  test("is deterministic for a given seed", () => {
    expect(toCandles(seededSeries(3, 16, 100, 0.1), 4)).toEqual(
      toCandles(seededSeries(3, 16, 100, 0.1), 4),
    );
  });
});
