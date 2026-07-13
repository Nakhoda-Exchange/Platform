import { describe, expect, test } from "bun:test";
import {
  BURN_ADDRESSES,
  buySellRatio,
  holderDeltaPercent,
  liquidityToMcap,
  mcapToFdv,
  normalizeAddress,
  priceImpactCurve,
  priceImpactPercent,
  REPRESENTATIVE_TRADE_SIZES_IRT,
  safeRatio,
  sniperSharePercent,
  top10PercentExcludingLpBurn,
  uniqueWalletCounts,
  volumeToLiquidity,
  type HolderPercent,
  type RawTrade,
} from "./metrics";

describe("normalizeAddress", () => {
  test("lowercases EVM (case-insensitive hex)", () => {
    expect(normalizeAddress("0xABCdef0000000000000000000000000000000000")).toBe(
      "0xabcdef0000000000000000000000000000000000",
    );
  });
  test("preserves Solana case (base58 is case-sensitive)", () => {
    const mint = "So11111111111111111111111111111111111111112";
    expect(normalizeAddress(mint)).toBe(mint);
    expect(normalizeAddress(mint)).not.toBe(mint.toLowerCase());
  });
  test("trims whitespace", () => {
    expect(normalizeAddress("  0xAbC  ".padEnd(6))).toBe("0xabc");
  });
});

describe("safeRatio & derived ratios", () => {
  test("computes a ratio", () => {
    expect(safeRatio(50, 200)).toBe(0.25);
  });
  test("null on zero / negative / non-finite denominator", () => {
    expect(safeRatio(1, 0)).toBeNull();
    expect(safeRatio(1, -5)).toBeNull();
    expect(safeRatio(1, NaN)).toBeNull();
    expect(safeRatio(Infinity, 2)).toBeNull();
  });
  test("liquidityToMcap / volumeToLiquidity / mcapToFdv", () => {
    expect(liquidityToMcap(120_000, 1_000_000)).toBe(0.12);
    expect(volumeToLiquidity(500_000, 100_000)).toBe(5); // wash-trade signal
    expect(mcapToFdv(300_000, 1_000_000)).toBe(0.3);
  });
});

describe("holderDeltaPercent", () => {
  test("positive and negative trends", () => {
    expect(holderDeltaPercent(1100, 1000)).toBe(10);
    expect(holderDeltaPercent(900, 1000)).toBe(-10);
  });
  test("null without a baseline", () => {
    expect(holderDeltaPercent(1000, 0)).toBeNull();
  });
});

describe("buySellRatio", () => {
  test("ratio of buys to sells", () => {
    expect(buySellRatio(300, 150)).toBe(2);
  });
  test("null on zero sells (avoid /0 and ∞)", () => {
    expect(buySellRatio(10, 0)).toBeNull();
  });
});

describe("top10PercentExcludingLpBurn", () => {
  test("excludes the LP pool — the raw top holder is usually the DEX pool", () => {
    const holders: HolderPercent[] = [
      { address: "0xPOOL", percent: 60 }, // LP pool — must be excluded
      { address: "0xa", percent: 8 },
      { address: "0xb", percent: 5 },
      { address: "0xc", percent: 3 },
    ];
    // Without exclusion the top-10 would be 76%; excluding the pool → 16%.
    expect(top10PercentExcludingLpBurn(holders, ["0xpool"])).toBe(16);
  });

  test("excludes known burn addresses even when not passed in, case-insensitively (EVM)", () => {
    const holders: HolderPercent[] = [
      { address: "0x000000000000000000000000000000000000DEAD", percent: 40 }, // burn, upper
      { address: "0x0000000000000000000000000000000000000000", percent: 20 }, // zero
      { address: "0xa", percent: 7 },
      { address: "0xb", percent: 3 },
    ];
    expect(top10PercentExcludingLpBurn(holders)).toBe(10);
  });

  test("Solana burn (incinerator) excluded; case is NOT folded for base58", () => {
    const incinerator = "1nc1nerator11111111111111111111111111111111";
    const holders: HolderPercent[] = [
      { address: incinerator, percent: 50 }, // excluded
      { address: "So11111111111111111111111111111111111111112", percent: 9 },
      { address: "so11111111111111111111111111111111111111112", percent: 4 }, // different address (lowercased) — NOT the same holder
    ];
    // Both non-burn holders count (they are distinct base58 strings): 9 + 4.
    expect(top10PercentExcludingLpBurn(holders)).toBe(13);
  });

  test("sums only the top 10 of the remaining holders", () => {
    const holders: HolderPercent[] = Array.from({ length: 15 }, (_, i) => ({
      address: `0x${i}`,
      percent: i + 1, // 1..15
    }));
    // Top 10 of 1..15 = 15+14+…+6 = 105.
    expect(top10PercentExcludingLpBurn(holders)).toBe(105);
  });

  test("null when there are no holders", () => {
    expect(top10PercentExcludingLpBurn([])).toBeNull();
  });

  test("burn address list is non-empty and includes zero + dead + incinerator", () => {
    expect(BURN_ADDRESSES.length).toBeGreaterThan(0);
    expect(BURN_ADDRESSES).toContain(
      "0x000000000000000000000000000000000000dead",
    );
    expect(BURN_ADDRESSES).toContain(
      "1nc1nerator11111111111111111111111111111111",
    );
  });
});

describe("sniperSharePercent", () => {
  test("sums current holdings of first-N-seconds buyers", () => {
    const holders: HolderPercent[] = [
      { address: "0xSNIPE1", percent: 12 },
      { address: "0xSNIPE2", percent: 8 },
      { address: "0xnormal", percent: 5 },
    ];
    expect(sniperSharePercent(holders, ["0xsnipe1", "0xsnipe2"])).toBe(20);
  });
  test("null with no holders", () => {
    expect(sniperSharePercent([], ["0xa"])).toBeNull();
  });
});

describe("uniqueWalletCounts", () => {
  test("counts unique WALLETS, not transactions (one wallet looping = 1 buyer)", () => {
    const trades: RawTrade[] = [
      { wallet: "0xbot", side: "buy" },
      { wallet: "0xbot", side: "buy" },
      { wallet: "0xbot", side: "buy" },
      { wallet: "0xreal", side: "buy" },
      { wallet: "0xseller", side: "sell" },
    ];
    const r = uniqueWalletCounts(trades);
    expect(r.uniqueBuyers).toBe(2); // 0xbot + 0xreal, despite 4 buy tx
    expect(r.buys).toBe(4); // raw tx count preserved
    expect(r.uniqueSellers).toBe(1);
    expect(r.sells).toBe(1);
  });

  test("same EVM wallet in different case counts once", () => {
    const trades: RawTrade[] = [
      { wallet: "0xABC", side: "buy" },
      { wallet: "0xabc", side: "buy" },
    ];
    expect(uniqueWalletCounts(trades).uniqueBuyers).toBe(1);
  });

  test("empty input", () => {
    expect(uniqueWalletCounts([])).toEqual({
      uniqueBuyers: 0,
      uniqueSellers: 0,
      buys: 0,
      sells: 0,
    });
  });
});

describe("priceImpact", () => {
  test("impact grows monotonically with trade size", () => {
    const liq = 1_000_000_000; // 1B Toman
    const small = priceImpactPercent(10_000_000, liq)!;
    const mid = priceImpactPercent(100_000_000, liq)!;
    const big = priceImpactPercent(1_000_000_000, liq)!;
    expect(small).toBeLessThan(mid);
    expect(mid).toBeLessThan(big);
    expect(small).toBeGreaterThan(0);
  });

  test("a trade equal to the quote reserve moves price ~50%", () => {
    // quoteReserve = liq/2; size == quoteReserve → 50/(50+50) = 50%.
    expect(priceImpactPercent(500, 1000)).toBe(50);
  });

  test("null on bad inputs", () => {
    expect(priceImpactPercent(100, 0)).toBeNull();
    expect(priceImpactPercent(0, 1000)).toBeNull();
    expect(priceImpactPercent(-5, 1000)).toBeNull();
  });

  test("curve returns a point per representative size; null when illiquid", () => {
    const curve = priceImpactCurve(1_000_000_000)!;
    expect(curve).toHaveLength(REPRESENTATIVE_TRADE_SIZES_IRT.length);
    expect(curve[0].sizeIrt).toBe(REPRESENTATIVE_TRADE_SIZES_IRT[0]);
    expect(priceImpactCurve(0)).toBeNull();
  });
});
