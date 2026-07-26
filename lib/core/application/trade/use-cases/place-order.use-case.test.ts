import { describe, expect, test } from "bun:test";
import { PlaceOrderUseCase } from "./place-order.use-case";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type {
  TradeBalances,
  TradeRepository,
} from "../ports/trade-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import type {
  OrderSubmission,
  OrderType,
  TradeSide,
} from "@/lib/core/domain/trade/order";
import { fail, ok, type Result } from "@/lib/core/domain/shared/result";

/** A caller-minted idempotency key (issue #55) — threaded on every submit. */
const KEY = "intent-key-1";

const BTC: Coin = {
  id: "btc",
  name: "بیت‌کوین",
  symbol: "BTC",
  iconUrl: "",
  // Prices are decimal strings on the wire (nullable). 4B Toman, 65k USD.
  priceIrt: "4000000000",
  priceUsd: "65000",
  change24h: 1,
  marketCap: 1,
  isNew: false,
};

const marketStub: MarketRepository = {
  listCoins: async () => ok([BTC]),
  getCoinDetail: async () => ok(null),
  getCoinChart: async () => ok(null),
};

function tradeStub(balances: TradeBalances) {
  const placed: Array<{
    side: TradeSide;
    amountCoin: number;
    totalIrt: number;
    feeIrt: number;
    idempotencyKey: string;
    orderType: OrderType;
    targetPriceIrt: number | null;
    amountCoinRaw?: string;
  }> = [];
  const repo: TradeRepository = {
    getBalances: async () => ok(balances),
    getLimits: async () => ok({ defaultMinIrt: null, bySymbol: {} }),
    getQuote: async () => ok({ expectedSlippageBps: null }),
    placeOrder: async (
      coin,
      side,
      amountCoin,
      totalIrt,
      feeIrt,
      idempotencyKey,
      options,
    ): Promise<Result<OrderSubmission>> => {
      const orderType = options?.orderType ?? "MARKET";
      placed.push({
        side,
        amountCoin,
        totalIrt,
        feeIrt,
        idempotencyKey,
        orderType,
        targetPriceIrt: options?.targetPriceIrt ?? null,
        amountCoinRaw: options?.amountCoinRaw,
      });
      // A MARKET order settles synchronously; a LIMIT order is accepted (202).
      if (orderType === "LIMIT") {
        return ok({ kind: "accepted", orderId: "ord_1", phase: "pending" });
      }
      return ok({
        kind: "settled",
        order: {
          id: "1",
          side,
          coinId: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          amountCoin,
          totalIrt,
          feeIrt,
          priceIrt: Number(coin.priceIrt),
        },
      });
    },
    getOrder: async () => ok({ orderId: "ord_1", status: "SETTLED" as const }),
    listOpenOrders: async () => ok([]),
    cancelOrder: async () => ok(undefined),
  };
  return { repo, placed };
}

describe("PlaceOrderUseCase", () => {
  test("rejects orders below the minimum", async () => {
    const { repo, placed } = tradeStub({ availableIrt: 1e9, coinAmounts: {} });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      100_000,
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("BELOW_MIN_ORDER");
    expect(placed.length).toBe(0);
  });

  test("per-token min overrides the global fallback (both directions)", async () => {
    const limits = {
      defaultMinIrt: null,
      bySymbol: {
        BTC: {
          minBuyIrt: 200_000,
          maxBuyIrt: null,
          minSellIrt: null,
          maxSellIrt: null,
        },
      },
    };
    // 300k is below the 500k global floor but above the 200k per-token min → allowed.
    const allowed = tradeStub({ availableIrt: 1e9, coinAmounts: {} });
    allowed.repo.getLimits = async () => ok(limits);
    const okRes = await new PlaceOrderUseCase(marketStub, allowed.repo).execute(
      "btc",
      "buy",
      300_000,
      { idempotencyKey: KEY },
    );
    expect(okRes.ok).toBe(true);
    expect(allowed.placed[0]?.totalIrt).toBe(300_000);

    // 100k is below the per-token min → rejected.
    const rejected = tradeStub({ availableIrt: 1e9, coinAmounts: {} });
    rejected.repo.getLimits = async () => ok(limits);
    const belowRes = await new PlaceOrderUseCase(
      marketStub,
      rejected.repo,
    ).execute("btc", "buy", 100_000, { idempotencyKey: KEY });
    expect(belowRes.ok).toBe(false);
    if (!belowRes.ok) expect(belowRes.error.code).toBe("BELOW_MIN_ORDER");
    expect(rejected.placed.length).toBe(0);
  });

  test("the API global floor (defaultMinIrt) replaces the hardcoded 500k fallback", async () => {
    // Admin lowered the global floor to 100k; no per-token min for BTC. An order
    // of 200k — below the offline 500k constant but above the API floor — is allowed.
    const lowered = { defaultMinIrt: 100_000, bySymbol: {} };
    const allowed = tradeStub({ availableIrt: 1e9, coinAmounts: {} });
    allowed.repo.getLimits = async () => ok(lowered);
    const okRes = await new PlaceOrderUseCase(marketStub, allowed.repo).execute(
      "btc",
      "buy",
      200_000,
      { idempotencyKey: KEY },
    );
    expect(okRes.ok).toBe(true);
    expect(allowed.placed[0]?.totalIrt).toBe(200_000);

    // 50k is below the 100k API floor → rejected (the floor is enforced).
    const rejected = tradeStub({ availableIrt: 1e9, coinAmounts: {} });
    rejected.repo.getLimits = async () => ok(lowered);
    const belowRes = await new PlaceOrderUseCase(
      marketStub,
      rejected.repo,
    ).execute("btc", "buy", 50_000, { idempotencyKey: KEY });
    expect(belowRes.ok).toBe(false);
    if (!belowRes.ok) expect(belowRes.error.code).toBe("BELOW_MIN_ORDER");
    expect(rejected.placed.length).toBe(0);
  });

  test("blocks (does not lower the floor) when the limits fetch FAILS (#53)", async () => {
    // A transient limits outage must NOT silently drop to the offline floor and
    // accept a below-venue order — it blocks with LIMITS_UNAVAILABLE.
    const { repo, placed } = tradeStub({ availableIrt: 1e12, coinAmounts: {} });
    repo.getLimits = async () => fail("HTTP_503", "limits down");
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      5_000_000,
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("LIMITS_UNAVAILABLE");
    expect(placed.length).toBe(0);
  });

  test("rejects an order above the per-token max", async () => {
    const { repo, placed } = tradeStub({ availableIrt: 1e12, coinAmounts: {} });
    repo.getLimits = async () =>
      ok({
        defaultMinIrt: null,
        bySymbol: {
          BTC: {
            minBuyIrt: null,
            maxBuyIrt: 1_000_000,
            minSellIrt: null,
            maxSellIrt: null,
          },
        },
      });
    const res = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      2_000_000,
      { idempotencyKey: KEY },
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("ABOVE_MAX_ORDER");
    expect(placed.length).toBe(0);
  });

  test("rejects a buy above the cash balance", async () => {
    const { repo } = tradeStub({ availableIrt: 1_000_000, coinAmounts: {} });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      2_000_000,
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INSUFFICIENT_IRT");
  });

  test("buys convert net-of-fee Toman to coin units", async () => {
    const { repo, placed } = tradeStub({ availableIrt: 1e10, coinAmounts: {} });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "BTC",
      "buy",
      2_000_000_000,
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(true);
    // fee = 0.35% of 2B = 7,000,000; coins bought with the remainder
    expect(placed[0]?.feeIrt).toBe(7_000_000);
    expect(placed[0]?.amountCoin).toBe(1_993_000_000 / 4_000_000_000);
    expect(placed[0]?.totalIrt).toBe(2_000_000_000);
  });

  test("forwards the caller's idempotency key to the adapter (#55)", async () => {
    const { repo, placed } = tradeStub({ availableIrt: 1e10, coinAmounts: {} });
    await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      2_000_000_000,
      { idempotencyKey: "abc-123" },
    );
    expect(placed[0]?.idempotencyKey).toBe("abc-123");
  });

  test("refuses a submit with no idempotency key (#55)", async () => {
    const { repo, placed } = tradeStub({ availableIrt: 1e10, coinAmounts: {} });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      2_000_000_000,
      { idempotencyKey: "" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MISSING_IDEMPOTENCY_KEY");
    expect(placed.length).toBe(0);
  });

  test("uses the caller's EFFECTIVE fee rate when the backend surfaces one (#76)", async () => {
    // A referral invitee at 0.245% (24.5 bps) — the fee must follow that, not the
    // fixed 0.35%.
    const { repo, placed } = tradeStub({ availableIrt: 1e10, coinAmounts: {} });
    repo.getLimits = async () =>
      ok({ defaultMinIrt: null, bySymbol: {}, effectiveFeeRateBps: 24.5 });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      2_000_000_000,
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(true);
    // 24.5 bps of 2B = 4,900,000 (vs the 7,000,000 the default 35 bps would give).
    expect(placed[0]?.feeIrt).toBe(4_900_000);
  });

  test("sell fee is charged on the proceeds, coin amount stays gross", async () => {
    const { repo, placed } = tradeStub({
      availableIrt: 0,
      coinAmounts: { BTC: 1 },
    });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "sell",
      2_000_000_000, // 0.5 BTC gross
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(true);
    expect(placed[0]?.amountCoin).toBe(0.5);
    expect(placed[0]?.feeIrt).toBe(7_000_000);
  });

  test("rejects a sell above the held amount", async () => {
    const { repo } = tradeStub({
      availableIrt: 0,
      coinAmounts: { BTC: 0.001 },
    });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "sell",
      100_000_000, // 0.025 BTC ≫ 0.001 held
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INSUFFICIENT_COIN");
  });

  test("subtracts locked units from the sellable balance (#73)", async () => {
    // 1 BTC held but 0.9 locked by an open order → only 0.1 sellable. A 0.5-BTC
    // sell (2B Toman) must be rejected as INSUFFICIENT_COIN.
    const { repo } = tradeStub({
      availableIrt: 0,
      coinAmounts: { BTC: 0.1 }, // adapter already nets this
      coinAmountsRaw: { BTC: "1" },
      lockedCoinAmountsRaw: { BTC: "0.9" },
    });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "sell",
      2_000_000_000,
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INSUFFICIENT_COIN");
  });

  test("sells the EXACT held balance (raw string) on a «sell all» overshoot, no float loss (#57)", async () => {
    // An 18-decimal holding a JS float cannot represent exactly. held × price =
    // 493,827,156.049… Toman; the «همه» keypad rounds UP to a whole-Toman notional
    // that overshoots by <0.5%, so the clamp fires and the EXACT held string —
    // not a lossy float re-derivation — is what gets committed on the wire.
    const heldRaw = "0.123456789012345678"; // × 4e9 ≈ 493,827,156.049 Toman
    const { repo, placed } = tradeStub({
      availableIrt: 0,
      coinAmounts: { BTC: 0.123456789012345678 },
      coinAmountsRaw: { BTC: heldRaw },
    });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "sell",
      493_827_157, // one Toman over the exact notional (within the 0.5% clamp)
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(true);
    expect(placed[0]?.amountCoinRaw).toBe(heldRaw);
  });

  test("preserves the repository error code (e.g. PRICE_UNAVAILABLE)", async () => {
    // The HTTP client turns a 503 body into fail("PRICE_UNAVAILABLE", …); the
    // use case must not flatten it, so the trade action/UI can special-case it.
    const repo: TradeRepository = {
      getBalances: async () => ok({ availableIrt: 1e10, coinAmounts: {} }),
      getLimits: async () => ok({ defaultMinIrt: null, bySymbol: {} }),
      getQuote: async () => ok({ expectedSlippageBps: null }),
      placeOrder: async () =>
        fail<OrderSubmission>(
          "PRICE_UNAVAILABLE",
          "قیمت لحظه‌ای در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.",
        ),
      getOrder: async () =>
        ok({ orderId: "ord_1", status: "SETTLED" as const }),
      listOpenOrders: async () => ok([]),
      cancelOrder: async () => ok(undefined),
    };
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      2_000_000_000,
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PRICE_UNAVAILABLE");
  });

  test("refuses to price an order when the coin price is unavailable (null)", async () => {
    // A null wire price means UNAVAILABLE — the order can't be priced, so the
    // use case fails with PRICE_UNAVAILABLE instead of dividing by 0/NaN.
    const noPriceMarket: MarketRepository = {
      ...marketStub,
      listCoins: async () => ok([{ ...BTC, priceIrt: null }]),
    };
    const { repo, placed } = tradeStub({ availableIrt: 1e10, coinAmounts: {} });
    const result = await new PlaceOrderUseCase(noPriceMarket, repo).execute(
      "btc",
      "buy",
      2_000_000_000,
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PRICE_UNAVAILABLE");
    expect(placed.length).toBe(0);
  });

  test("a MARKET order settles synchronously (200 path unchanged)", async () => {
    const { repo, placed } = tradeStub({ availableIrt: 1e10, coinAmounts: {} });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      2_000_000_000,
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.kind).toBe("settled");
    expect(placed[0]?.orderType).toBe("MARKET");
  });

  test("a LIMIT buy is ACCEPTED (202) and converts at the target price", async () => {
    const { repo, placed } = tradeStub({ availableIrt: 1e10, coinAmounts: {} });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      2_000_000_000,
      {
        idempotencyKey: KEY,
        orderType: "LIMIT",
        targetPriceIrt: 2_000_000_000,
      }, // half the live price
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.kind).toBe("accepted");
      if (result.data.kind === "accepted") {
        expect(result.data.orderId).toBe("ord_1");
        expect(result.data.phase).toBe("pending");
      }
    }
    // Coin amount is derived at the TARGET (2B), not the live price (4B):
    // fee = 0.35% of 2B = 7,000,000; (2B − fee) / 2B.
    expect(placed[0]?.orderType).toBe("LIMIT");
    expect(placed[0]?.targetPriceIrt).toBe(2_000_000_000);
    expect(placed[0]?.amountCoin).toBe(1_993_000_000 / 2_000_000_000);
  });

  test("a LIMIT order with no/invalid target price is rejected before submit", async () => {
    const { repo, placed } = tradeStub({ availableIrt: 1e10, coinAmounts: {} });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "buy",
      2_000_000_000,
      { idempotencyKey: KEY, orderType: "LIMIT", targetPriceIrt: 0 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_TARGET_PRICE");
    expect(placed.length).toBe(0);
  });

  test("a LIMIT order is placeable even when the live price is unavailable", async () => {
    // A limit rests on its own target, so a momentarily null live price must
    // NOT block it (unlike a market order).
    const noPriceMarket: MarketRepository = {
      ...marketStub,
      listCoins: async () => ok([{ ...BTC, priceIrt: null }]),
    };
    const { repo, placed } = tradeStub({ availableIrt: 1e10, coinAmounts: {} });
    const result = await new PlaceOrderUseCase(noPriceMarket, repo).execute(
      "btc",
      "buy",
      2_000_000_000,
      {
        idempotencyKey: KEY,
        orderType: "LIMIT",
        targetPriceIrt: 3_000_000_000,
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.kind).toBe("accepted");
    expect(placed[0]?.orderType).toBe("LIMIT");
  });

  test("clamps a «sell all» rounding overshoot to a full sell", async () => {
    // «همه» enters floor(held × price) Toman; the derived amount can exceed
    // the held units by a rounding hair and must clamp, not fail.
    const held = 0.0015;
    const { repo, placed } = tradeStub({
      availableIrt: 0,
      coinAmounts: { BTC: held },
    });
    const maxIrt = Math.floor(held * Number(BTC.priceIrt)) + 1_000; // overshoot ~0.02%
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "sell",
      maxIrt,
      { idempotencyKey: KEY },
    );
    expect(result.ok).toBe(true);
    expect(placed[0]?.amountCoin).toBe(held);
  });
});
