import {
  FEE_RATE,
  maxOrderIrt,
  minOrderIrt,
  type OrderSubmission,
  type OrderType,
  type TradeSide,
} from "@/lib/core/domain/trade/order";
import { parsePrice } from "@/lib/core/domain/market/price";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { TradeRepository } from "../ports/trade-repository.port";

/** Persian-grouped Toman (no unit-config dependency in the use-case layer). */
const faToman = new Intl.NumberFormat("fa-IR");

/** Options for a LIMIT order; omitted (or `orderType: "MARKET"`) for a market order. */
export interface PlaceOrderInput {
  orderType?: OrderType;
  /** Whole IRT per whole coin (the trigger price). Required for LIMIT. */
  targetPriceIrt?: number | null;
}

/**
 * Places an order. The IRT notional is entered in Toman; the coin amount is
 * derived at the execution price (the current price for MARKET, the target
 * price for LIMIT). All guards live here (the authoritative, server-side check)
 * — the UI only mirrors them for instant feedback.
 *
 * A MARKET order settles synchronously today; a LIMIT order (and, once the async
 * flag is on, a MARKET order too) is ACCEPTED and rests — the result is an
 * {@link OrderSubmission} the caller resolves by polling.
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
    input: PlaceOrderInput = {},
  ): Promise<Result<OrderSubmission>> {
    const orderType: OrderType = input.orderType ?? "MARKET";
    const isLimit = orderType === "LIMIT";
    // A LIMIT order rests until the market reaches its target; the price must be
    // a positive whole-Toman figure (the backend rejects a TARGET-unit limit,
    // so it's always a SPEND commitment at this price).
    const targetPriceIrt = input.targetPriceIrt ?? null;
    if (isLimit && (targetPriceIrt === null || targetPriceIrt <= 0)) {
      return fail("INVALID_TARGET_PRICE", "قیمت هدف را درست وارد کنید.");
    }

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
      ? limitsResult.data.bySymbol[coin.symbol.toUpperCase()]
      : undefined;
    const defaultMinIrt = limitsResult.ok
      ? limitsResult.data.defaultMinIrt
      : null;
    const minIrt = minOrderIrt(limits, side, defaultMinIrt);
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
    // The conversion price is the target for a LIMIT order (it commits at that
    // price) and the live price for a MARKET order. The live coin price is a
    // nullable decimal string on the wire; a null price is UNAVAILABLE. A MARKET
    // order can't be priced without it, so refuse honestly (mirrors the backend's
    // 503 PRICE_UNAVAILABLE) rather than dividing by 0/NaN. A LIMIT order rests
    // on its own target, so a momentarily stale live price does NOT block it.
    const livePriceIrt = parsePrice(coin.priceIrt);
    if (!isLimit && livePriceIrt === null) {
      return fail(
        "PRICE_UNAVAILABLE",
        "قیمت لحظه‌ای در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.",
      );
    }
    const conversionPriceIrt = isLimit ? targetPriceIrt! : livePriceIrt!;

    const feeIrt = Math.round(amountIrt * FEE_RATE);
    let amountCoin =
      (amountIrt - (side === "buy" ? feeIrt : 0)) / conversionPriceIrt;

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

    return this.trade.placeOrder(coin, side, amountCoin, amountIrt, feeIrt, {
      orderType,
      targetPriceIrt,
    });
  }
}
