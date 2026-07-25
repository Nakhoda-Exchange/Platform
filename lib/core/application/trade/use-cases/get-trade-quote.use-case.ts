import type { TradeSide } from "@/lib/core/domain/trade/order";
import type { TradeQuote } from "@/lib/core/domain/trade/quote";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { TradeRepository } from "../ports/trade-repository.port";

/**
 * Prices an order the user is composing, without placing it — the trade screen
 * reads the expected slippage from it as the amount changes.
 *
 * A non-positive amount is not an error: there is simply nothing to price yet
 * (an empty keypad), so it answers with an unknown-slippage quote instead of
 * spending a backend round-trip. Every other failure is the repository's to
 * report — the screen just hides the figure.
 */
export class GetTradeQuoteUseCase {
  constructor(private readonly trade: TradeRepository) {}

  async execute(
    symbol: string,
    side: TradeSide,
    amountIrt: number,
  ): Promise<Result<TradeQuote>> {
    if (!Number.isFinite(amountIrt) || amountIrt <= 0) {
      return ok({ expectedSlippageBps: null });
    }
    return this.trade.getQuote(symbol, side, amountIrt);
  }
}
