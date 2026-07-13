import { describe, expect, test } from "bun:test";
import { MarketSimulator } from "@/lib/infrastructure/realtime/market-simulator";

/** Deterministic RNG cycling through the given values. */
function rngOf(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe("MarketSimulator", () => {
  test("snapshot returns a price tick per seed coin", () => {
    const sim = new MarketSimulator(rngOf([0.5]));
    const ticks = sim.snapshot(100);

    expect(ticks.length).toBeGreaterThan(0);
    for (const tick of ticks) {
      expect(tick.type).toBe("price");
      expect(tick.at).toBe(100);
      expect(typeof tick.priceIrt).toBe("number");
    }
    // At seed prices, derived change is zero.
    expect(ticks.every((t) => t.change24h === 0)).toBe(true);
  });

  test("prices stay within ±8% of the base under sustained drift", () => {
    const sim = new MarketSimulator(rngOf([1])); // max upward drift each step
    let ticks = sim.snapshot(0);
    for (let step = 0; step < 500; step++) ticks = sim.advancePrices(step);

    for (const tick of ticks) {
      expect(tick.change24h).toBeGreaterThan(0);
      expect(tick.change24h).toBeLessThanOrEqual(8.01);
    }
  });

  test("opens a pending trade with an expiry, then fills it", () => {
    // rng = 0 → opens (0 < 0.6), buy (0 < 0.5), fills (0 < 0.5).
    const sim = new MarketSimulator(() => 0, 30_000);

    const opened = sim.advanceTrades(1_000);
    expect(opened).toHaveLength(1);
    expect(opened[0]).toMatchObject({ status: "pending", side: "buy" });
    expect(opened[0]!.expiresAt).toBe(31_000);

    const next = sim.advanceTrades(2_000);
    expect(next.map((e) => e.status)).toContain("open");
  });

  test("expires a trade once its deadline passes", () => {
    const sim = new MarketSimulator(() => 0, 10_000);
    const [opened] = sim.advanceTrades(0);

    const later = sim.advanceTrades(20_000);
    const expired = later.find((e) => e.tradeId === opened!.tradeId);
    expect(expired?.status).toBe("expired");
    expect(expired?.expiresAt).toBeUndefined();
  });
});
