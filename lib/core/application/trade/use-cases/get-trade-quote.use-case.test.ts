import { describe, expect, test } from "bun:test";
import { ok, fail } from "@/lib/core/domain/shared/result";
import type { TradeQuote } from "@/lib/core/domain/trade/quote";
import type { TradeRepository } from "../ports/trade-repository.port";
import { GetTradeQuoteUseCase } from "./get-trade-quote.use-case";

/** Repository double: records the quote calls, answers with a fixed figure. */
function repoStub(quote: TradeQuote | null) {
  const calls: Array<{ symbol: string; side: string; amountIrt: number }> = [];
  const repo = {
    getQuote: async (symbol: string, side: string, amountIrt: number) => {
      calls.push({ symbol, side, amountIrt });
      return quote
        ? ok(quote)
        : fail<TradeQuote>("HTTP_503", "قیمت لحظه‌ای در دسترس نیست.");
    },
  } as unknown as TradeRepository;
  return { repo, calls };
}

describe("GetTradeQuoteUseCase", () => {
  test("passes the order through and returns the expected slippage", async () => {
    const { repo, calls } = repoStub({ expectedSlippageBps: 37 });
    const result = await new GetTradeQuoteUseCase(repo).execute(
      "SOL",
      "buy",
      1_000_000,
    );
    expect(result.ok && result.data.expectedSlippageBps).toBe(37);
    expect(calls).toEqual([
      { symbol: "SOL", side: "buy", amountIrt: 1_000_000 },
    ]);
  });

  test("keeps a firm-price 0 as 0 (a real answer, not a missing one)", async () => {
    const { repo } = repoStub({ expectedSlippageBps: 0 });
    const result = await new GetTradeQuoteUseCase(repo).execute(
      "SOL",
      "buy",
      1_000_000,
    );
    expect(result.ok && result.data.expectedSlippageBps).toBe(0);
  });

  test("does not spend a round-trip on an empty amount", async () => {
    const { repo, calls } = repoStub({ expectedSlippageBps: 37 });
    const result = await new GetTradeQuoteUseCase(repo).execute(
      "SOL",
      "buy",
      0,
    );
    expect(result.ok && result.data.expectedSlippageBps).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test("surfaces a repository failure rather than inventing a figure", async () => {
    const { repo } = repoStub(null);
    const result = await new GetTradeQuoteUseCase(repo).execute(
      "SOL",
      "buy",
      1_000_000,
    );
    expect(result.ok).toBe(false);
  });
});
