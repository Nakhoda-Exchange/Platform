import { describe, expect, test } from "bun:test";
import { mapDexScreenerStats } from "./dexscreener.provider";

const NOW = 1_700_000_000_000;

describe("mapDexScreenerStats", () => {
  test("picks the deepest-liquidity pair on the token's chain", () => {
    const snap = mapDexScreenerStats(
      {
        pairs: [
          {
            chainId: "solana",
            pairAddress: "p1",
            priceUsd: "0.5",
            liquidity: { usd: 10_000 },
            fdv: 1_000_000,
            marketCap: 800_000,
            volume: { h24: 50_000 },
            pairCreatedAt: NOW - 3_600_000,
          },
          {
            chainId: "solana",
            pairAddress: "p2",
            priceUsd: "0.5",
            liquidity: { usd: 90_000 }, // deepest
            fdv: 1_000_000,
            marketCap: 800_000,
            volume: { h24: 200_000 },
            pairCreatedAt: NOW - 7_200_000,
          },
          {
            chainId: "ethereum", // wrong chain — must be ignored
            pairAddress: "p3",
            priceUsd: "0.5",
            liquidity: { usd: 500_000 },
          },
        ],
      },
      "solana",
      NOW,
    )!;
    expect(snap.liquidityUsd).toBe(90_000);
    expect(snap.volume24hUsd).toBe(200_000);
    expect(snap.marketCapUsd).toBe(800_000);
    expect(snap.ageMs).toBe(7_200_000);
    expect(snap.source).toBe("dexscreener");
    expect(snap.athPriceUsd).toBeNull(); // DexScreener has no ATH
  });

  test("fdv falls back to marketCap when absent", () => {
    const snap = mapDexScreenerStats(
      {
        pairs: [
          {
            chainId: "solana",
            pairAddress: "p",
            priceUsd: "1",
            liquidity: { usd: 5_000 },
            marketCap: 123,
          },
        ],
      },
      "solana",
      NOW,
    )!;
    expect(snap.fdvUsd).toBe(123);
  });

  test("null when there is no liquid pair on the chain", () => {
    expect(
      mapDexScreenerStats(
        {
          pairs: [
            { chainId: "ethereum", pairAddress: "x", liquidity: { usd: 1000 } },
          ],
        },
        "solana",
        NOW,
      ),
    ).toBeNull();
    expect(mapDexScreenerStats({ pairs: null }, "solana", NOW)).toBeNull();
  });
});
