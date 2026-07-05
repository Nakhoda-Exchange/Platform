import {
  FEE_RATE,
  MIN_ORDER_IRT,
  type PlacedOrder,
  type TradeSide,
} from "@/lib/core/domain/trade/order";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { TradeRepository } from "../ports/trade-repository.port";

/**
 * Places a market order. The amount is entered in Toman; the coin amount is
 * derived at the current price. All guards live here (the authoritative,
 * server-side check) — the UI only mirrors them for instant feedback.
 */
export class PlaceOrderUseCase {
  constructor(
    private readonly market: MarketRepository,
    private readonly trade: TradeRepository,
  ) {}

  async execute(
    coinIdOrSymbol: string,
    side: TradeSide,
    amountIrt: number,
  ): Promise<Result<PlacedOrder>> {
    if (!Number.isFinite(amountIrt) || amountIrt <= 0) {
      return fail("EMPTY_AMOUNT", "مبلغ سفارش را وارد کنید.");
    }
    if (amountIrt < MIN_ORDER_IRT) {
      return fail("BELOW_MIN_ORDER", "کمینه هر سفارش ۵۰۰٬۰۰۰ تومان است.");
    }

    const coins = await this.market.listCoins();
    if (!coins.ok) return coins;
    const key = coinIdOrSymbol.toLowerCase();
    const coin = coins.data.find(
      (c) => c.id === key || c.symbol.toLowerCase() === key,
    );
    if (!coin) return fail("UNKNOWN_COIN", "این رمزارز قابل معامله نیست.");

    const balances = await this.trade.getBalances();
    if (!balances.ok) return balances;
    const { availableIrt, coinAmounts } = balances.data;

    // The 0.35% fee: a buyer's fee comes out of the entered amount (they
    // receive coins for the remainder); a seller's fee comes out of the
    // proceeds. Either way the fee accrues to the platform (referral pool).
    const feeIrt = Math.round(amountIrt * FEE_RATE);
    let amountCoin =
      (amountIrt - (side === "buy" ? feeIrt : 0)) / coin.priceIrt;

    if (side === "buy") {
      if (amountIrt > availableIrt) {
        return fail("INSUFFICIENT_IRT", "موجودی تومانی شما کافی نیست.");
      }
    } else {
      const held = coinAmounts[coin.id] ?? 0;
      // «فروش همه» enters floor(held × price) Toman, so the derived coin
      // amount can land a hair above the held units — clamp that rounding
      // artifact to a full sell instead of rejecting it.
      if (amountCoin > held && amountCoin <= held * 1.005) amountCoin = held;
      if (amountCoin > held) {
        return fail("INSUFFICIENT_COIN", "موجودی این رمزارز کافی نیست.");
      }
    }

    return this.trade.placeOrder(coin, side, amountCoin, amountIrt, feeIrt);
  }
}
