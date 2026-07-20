import {
  FEE_RATE,
  maxOrderIrt,
  minOrderIrt,
  type PlacedOrder,
  type TradeSide,
} from "@/lib/core/domain/trade/order";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { TradeRepository } from "../ports/trade-repository.port";

/** Persian-grouped Toman (no unit-config dependency in the use-case layer). */
const faToman = new Intl.NumberFormat("fa-IR");

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

    const coins = await this.market.listCoins();
    if (!coins.ok) return coins;
    const key = coinIdOrSymbol.toLowerCase();
    const coin = coins.data.find(
      (c) => c.id === key || c.symbol.toLowerCase() === key,
    );
    if (!coin) return fail("UNKNOWN_COIN", "این رمزارز قابل معامله نیست.");

    // Per-token min/max (GET /v1/trade/limits) for this symbol+side, with the
    // global floor as fallback. A limits failure must not block trading, so an
    // errored fetch degrades to no per-token bounds (→ MIN_ORDER_IRT floor).
    const limitsResult = await this.trade.getLimits();
    const limits = limitsResult.ok
      ? limitsResult.data[coin.symbol.toUpperCase()]
      : undefined;
    const minIrt = minOrderIrt(limits, side);
    if (amountIrt < minIrt) {
      return fail(
        "BELOW_MIN_ORDER",
        `کمینه این سفارش ${faToman.format(minIrt)} تومان است.`,
      );
    }
    const maxIrt = maxOrderIrt(limits, side);
    if (maxIrt !== null && amountIrt > maxIrt) {
      return fail(
        "ABOVE_MAX_ORDER",
        `بیشینه این سفارش ${faToman.format(maxIrt)} تومان است.`,
      );
    }

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
      // Balances are keyed by symbol (portfolio ids ≠ market ids for tokens).
      const held = coinAmounts[coin.symbol.toUpperCase()] ?? 0;
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
