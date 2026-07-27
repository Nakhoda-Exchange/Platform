import { describe, expect, test } from "bun:test";
import { HttpClient } from "@/lib/infrastructure/http/http-client";
import { HttpTradeRepository } from "@/lib/infrastructure/trade/http-trade.repository";
import type { Coin } from "@/lib/core/domain/market/coin";

const COIN: Coin = {
  id: "dx_bonk",
  name: "Bonk",
  symbol: "BONK",
  iconUrl: "",
  priceIrt: "2500",
  priceUsd: "0.00002",
  change24h: 1.2,
  marketCap: 1,
  isNew: false,
};

/** Captures the JSON body the repository puts on the wire. */
function repoCapturing(sent: unknown[]): HttpTradeRepository {
  const http = new HttpClient({
    baseUrl: "https://api.test",
    fetchFn: async (_input, init) => {
      sent.push(JSON.parse(String(init?.body)));
      return new Response(
        JSON.stringify({ orderId: "o_1", status: "FILLED" }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    },
  });
  return new HttpTradeRepository(http);
}

describe("HttpTradeRepository.placeOrder wire types", () => {
  test("sends slippageBps as a NUMBER, not a string", async () => {
    // The backend types this field `z.number().int().min(0).max(10_000)` while
    // every sibling field is an IntString. Sending "300" made zod reject the
    // whole order with VALIDATION_ERROR, so any user who had set a slippage
    // tolerance could not trade at all — and users on the default could.
    const sent: unknown[] = [];
    await repoCapturing(sent).placeOrder(
      COIN,
      "buy",
      40,
      100_000,
      350,
      "idem-1",
      {
        orderType: "MARKET",
        slippageBps: 300,
      },
    );

    const body = sent[0] as Record<string, unknown>;
    expect(typeof body.slippageBps).toBe("number");
    expect(body.slippageBps).toBe(300);
  });

  test("omits slippageBps entirely when the user set no tolerance", async () => {
    // Absent, not zero: the backend resolves the coin's configured value, and a
    // literal 0 would instead pin the band to no tolerance at all.
    const sent: unknown[] = [];
    await repoCapturing(sent).placeOrder(
      COIN,
      "buy",
      40,
      100_000,
      350,
      "idem-2",
    );

    expect(sent[0] as Record<string, unknown>).not.toHaveProperty(
      "slippageBps",
    );
  });

  test("keeps the IntString money fields as strings", async () => {
    // These ARE strings on the backend contract (exact bigint amounts, no float
    // money), so the fix above must not turn them numeric.
    const sent: unknown[] = [];
    await repoCapturing(sent).placeOrder(
      COIN,
      "buy",
      40,
      100_000,
      350,
      "idem-3",
      {
        orderType: "MARKET",
        slippageBps: 300,
      },
    );

    const body = sent[0] as Record<string, unknown>;
    expect(typeof body.amount).toBe("string");
    expect(typeof body.requestedPrice).toBe("string");
  });
});
