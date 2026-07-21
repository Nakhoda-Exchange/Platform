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
    orderType: OrderType;
    targetPriceIrt: number | null;
  }> = [];
  const repo: TradeRepository = {
    getBalances: async () => ok(balances),
    getLimits: async () => ok({ defaultMinIrt: null, bySymbol: {} }),
    placeOrder: async (
      coin,
      side,
      amountCoin,
      totalIrt,
      feeIrt,
      options,
    ): Promise<Result<OrderSubmission>> => {
      const orderType = options?.orderType ?? "MARKET";
      placed.push({
        side,
        amountCoin,
        totalIrt,
        feeIrt,
        orderType,
        targetPriceIrt: options?.targetPriceIrt ?? null,
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
    );
    expect(okRes.ok).toBe(true);
    expect(allowed.placed[0]?.totalIrt).toBe(300_000);

    // 100k is below the per-token min → rejected.
    const rejected = tradeStub({ availableIrt: 1e9, coinAmounts: {} });
    rejected.repo.getLimits = async () => ok(limits);
    const belowRes = await new PlaceOrderUseCase(
      marketStub,
      rejected.repo,
    ).execute("btc", "buy", 100_000);
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
    );
    expect(okRes.ok).toBe(true);
    expect(allowed.placed[0]?.totalIrt).toBe(200_000);

    // 50k is below the 100k API floor → rejected (the floor is enforced).
    const rejected = tradeStub({ availableIrt: 1e9, coinAmounts: {} });
    rejected.repo.getLimits = async () => ok(lowered);
    const belowRes = await new PlaceOrderUseCase(
      marketStub,
      rejected.repo,
    ).execute("btc", "buy", 50_000);
    expect(belowRes.ok).toBe(false);
    if (!belowRes.ok) expect(belowRes.error.code).toBe("BELOW_MIN_ORDER");
    expect(rejected.placed.length).toBe(0);
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
    );
    expect(result.ok).toBe(true);
    // fee = 0.35% of 2B = 7,000,000; coins bought with the remainder
    expect(placed[0]?.feeIrt).toBe(7_000_000);
    expect(placed[0]?.amountCoin).toBe(1_993_000_000 / 4_000_000_000);
    expect(placed[0]?.totalIrt).toBe(2_000_000_000);
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
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INSUFFICIENT_COIN");
  });

  test("preserves the repository error code (e.g. PRICE_UNAVAILABLE)", async () => {
    // The HTTP client turns a 503 body into fail("PRICE_UNAVAILABLE", …); the
    // use case must not flatten it, so the trade action/UI can special-case it.
    const repo: TradeRepository = {
      getBalances: async () => ok({ availableIrt: 1e10, coinAmounts: {} }),
      getLimits: async () => ok({ defaultMinIrt: null, bySymbol: {} }),
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
      { orderType: "LIMIT", targetPriceIrt: 2_000_000_000 }, // half the live price
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
      { orderType: "LIMIT", targetPriceIrt: 0 },
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
      { orderType: "LIMIT", targetPriceIrt: 3_000_000_000 },
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
    );
    expect(result.ok).toBe(true);
    expect(placed[0]?.amountCoin).toBe(held);
  });
});
