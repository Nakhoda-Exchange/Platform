import { describe, expect, test } from "bun:test";
import { HttpClient } from "@/lib/infrastructure/http/http-client";
import { HttpTradeRepository } from "@/lib/infrastructure/trade/http-trade.repository";
import type { Coin } from "@/lib/core/domain/market/coin";

const COIN: Coin = {
  id: "dx_bonk",
  name: "Bonk",
  symbol: "BONK",
  iconUrl: "",
  // BONK really does trade below one Toman — this is a live production figure.
  priceIrt: "0.59323356936",
  priceUsd: "0.00000315",
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

  test("sends a sub-Toman price EXACTLY, not rounded to whole Toman", async () => {
    // Issue #111. BONK is worth ~0.593 Toman, so Math.round sent "1" — 68% above
    // the market price the backend guards against. Every BONK order was refused
    // with PRICE_OUT_OF_TOLERANCE, and no user action could change that: the
    // rounding happened here, not in anything the user typed.
    const sent: unknown[] = [];
    await repoCapturing(sent).placeOrder(
      COIN,
      "buy",
      40,
      100_000,
      350,
      "idem-4",
    );

    const body = sent[0] as Record<string, unknown>;
    expect(body.requestedPrice).toBe("0.59323356936");
  });

  test("sends sellAll as a BOOLEAN on a full sell (issue #54)", async () => {
    // The backend has sized sell-alls from the ledger since #54 — and waived
    // the minimum for them — but the flag was never sent, so every «فروش همه»
    // went as an ordinary notional order: dust left behind, and a holding under
    // the floor unsellable.
    const sent: unknown[] = [];
    await repoCapturing(sent).placeOrder(
      COIN,
      "sell",
      1234.5,
      732,
      2,
      "idem-sell-all",
      { orderType: "MARKET", sellAll: true, amountCoinRaw: "1234.5" },
    );

    const body = sent[0] as Record<string, unknown>;
    expect(body.sellAll).toBe(true);
    expect(body.side).toBe("SELL");
  });

  test("never sends sellAll on a BUY", async () => {
    const sent: unknown[] = [];
    await repoCapturing(sent).placeOrder(COIN, "buy", 40, 100_000, 350, "i", {
      orderType: "MARKET",
      sellAll: true,
    });
    expect(sent[0] as Record<string, unknown>).not.toHaveProperty("sellAll");
  });
});

describe("HttpTradeRepository.placeOrder failure modes", () => {
  test("a lost response is UNCONFIRMED, not a failure", async () => {
    // A MARKET order settles synchronously against a venue, so the submit can
    // outlive any client budget — and aborting it does not cancel the order.
    // Reporting «اتصال برقرار نشد» told users a live order had failed, which
    // they act on by placing a second one.
    const http = new HttpClient({
      baseUrl: "https://api.test",
      fetchFn: async () => {
        throw new Error("connection reset");
      },
    });
    const result = await new HttpTradeRepository(http).placeOrder(
      COIN,
      "buy",
      40,
      100_000,
      350,
      "idem-lost",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SUBMIT_UNCONFIRMED");
      expect(result.error.message).not.toContain("ناموفق");
    }
  });

  test("a rejection reason never reaches the user as its machine token", async () => {
    const http = new HttpClient({
      baseUrl: "https://api.test",
      fetchFn: async () =>
        new Response(
          JSON.stringify({ status: "REJECTED", reason: "RESERVE_FAILED" }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    });
    const result = await new HttpTradeRepository(http).placeOrder(
      COIN,
      "sell",
      40,
      100_000,
      350,
      "idem-rej",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("موجودی شما برای این سفارش کافی نیست.");
      expect(/[A-Za-z]/.test(result.error.message)).toBe(false);
    }
  });
});
