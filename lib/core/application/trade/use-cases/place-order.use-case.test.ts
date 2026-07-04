import { describe, expect, test } from "bun:test";
import { PlaceOrderUseCase } from "./place-order.use-case";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type {
  TradeBalances,
  TradeRepository,
} from "../ports/trade-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import type { PlacedOrder, TradeSide } from "@/lib/core/domain/trade/order";
import { ok, type Result } from "@/lib/core/domain/shared/result";

const BTC: Coin = {
  id: "btc",
  name: "بیت‌کوین",
  symbol: "BTC",
  iconUrl: "",
  priceIrt: 4_000_000_000,
  priceUsd: 65_000,
  change24h: 1,
  marketCap: 1,
  isNew: false,
};

const marketStub: MarketRepository = {
  listCoins: async () => ok([BTC]),
  getCoinDetail: async () => ok(null),
};

function tradeStub(balances: TradeBalances) {
  const placed: Array<{
    side: TradeSide;
    amountCoin: number;
    totalIrt: number;
  }> = [];
  const repo: TradeRepository = {
    getBalances: async () => ok(balances),
    placeOrder: async (
      coin,
      side,
      amountCoin,
      totalIrt,
    ): Promise<Result<PlacedOrder>> => {
      placed.push({ side, amountCoin, totalIrt });
      return ok({
        id: "1",
        side,
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        amountCoin,
        totalIrt,
        priceIrt: coin.priceIrt,
      });
    },
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

  test("buys convert Toman to coin units at the current price", async () => {
    const { repo, placed } = tradeStub({ availableIrt: 1e10, coinAmounts: {} });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "BTC",
      "buy",
      2_000_000_000,
    );
    expect(result.ok).toBe(true);
    expect(placed[0]?.amountCoin).toBe(0.5);
    expect(placed[0]?.totalIrt).toBe(2_000_000_000);
  });

  test("rejects a sell above the held amount", async () => {
    const { repo } = tradeStub({
      availableIrt: 0,
      coinAmounts: { btc: 0.001 },
    });
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "sell",
      100_000_000, // 0.025 BTC ≫ 0.001 held
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INSUFFICIENT_COIN");
  });

  test("clamps a «sell all» rounding overshoot to a full sell", async () => {
    // «همه» enters floor(held × price) Toman; the derived amount can exceed
    // the held units by a rounding hair and must clamp, not fail.
    const held = 0.0015;
    const { repo, placed } = tradeStub({
      availableIrt: 0,
      coinAmounts: { btc: held },
    });
    const maxIrt = Math.floor(held * BTC.priceIrt) + 1_000; // overshoot ~0.02%
    const result = await new PlaceOrderUseCase(marketStub, repo).execute(
      "btc",
      "sell",
      maxIrt,
    );
    expect(result.ok).toBe(true);
    expect(placed[0]?.amountCoin).toBe(held);
  });
});
