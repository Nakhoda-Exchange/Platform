import {
  FEE_RATE_BPS,
  feeIrtFor,
  maxOrderIrt,
  minOrderIrt,
  type OrderSubmission,
  type OrderType,
  type TradeSide,
} from "@/lib/core/domain/trade/order";
import {
  availableScaled,
  formatScaled,
  toScaled,
} from "@/lib/core/domain/trade/decimal";
import { parsePrice } from "@/lib/core/domain/market/price";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { TradeRepository } from "../ports/trade-repository.port";

/** Persian-grouped Toman (no unit-config dependency in the use-case layer). */
const faToman = new Intl.NumberFormat("fa-IR");

/** Extra inputs for placing an order; only `idempotencyKey` is required. */
export interface PlaceOrderInput {
  /**
   * A key minted ONCE per user intent by the caller (when the confirm sheet
   * opens) and REUSED on every retry — threaded through to the `Idempotency-Key`
   * header so a retry after a lost response replays the original settlement
   * instead of buying/selling twice (issue #55). REQUIRED; never minted here or
   * in the adapter.
   */
  idempotencyKey: string;
  orderType?: OrderType;
  /** Whole IRT per whole coin (the trigger price). Required for LIMIT. */
  targetPriceIrt?: number | null;
  /**
   * The USER's own slippage tolerance in bps (trade settings sheet). Passed
   * through untouched — the backend decides how it combines with the coin's
   * configured value, and it wins. Absent ⇒ the coin's own tolerance applies.
   */
  slippageBps?: number | null;
  /**
   * A server-minted quote id (issue #59) the order commits to, when the screen
   * obtained a fixed-price quote first. Absent ⇒ the price-band model applies.
   */
  quoteId?: string | null;
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
    input: PlaceOrderInput,
  ): Promise<Result<OrderSubmission>> {
    // A money-moving POST must carry a caller-minted idempotency key so a retry
    // replays rather than re-executes (issue #55). Refuse rather than silently
    // minting one (which would defeat the guarantee).
    if (!input.idempotencyKey) {
      return fail("MISSING_IDEMPOTENCY_KEY", "درخواست نامعتبر است.");
    }
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
    // global floor as fallback. A FETCH FAILURE must NOT silently lower the
    // effective minimum to the offline floor — that would accept below-venue
    // orders the house can't hedge during a transient limits outage (issue #53).
    // So distinguish "unconfigured" (fetch ok, no per-token/global min → use the
    // known-safe MIN_ORDER_IRT floor) from "fetch failed" (block honestly).
    const limitsResult = await this.trade.getLimits();
    if (!limitsResult.ok) {
      return fail(
        "LIMITS_UNAVAILABLE",
        "محدودیت‌های معامله در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.",
      );
    }
    const limits = limitsResult.data.bySymbol[coin.symbol.toUpperCase()];
    const defaultMinIrt = limitsResult.data.defaultMinIrt;
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
    const { availableIrt, coinAmounts, coinAmountsRaw, lockedCoinAmountsRaw } =
      balances.data;

    // The fee: a buyer's fee comes out of the entered amount (they receive coins
    // for the remainder); a seller's fee comes out of the proceeds. Either way it
    // accrues to the platform. The rate is the caller's EFFECTIVE
    // rate when the backend surfaces one (a caller may be discounted —
    // issue #76), else the FEE_RATE_BPS default; fee IRT is exact integer bps
    // math on the whole-Toman notional, not a float multiply (issue #57).
    const feeRateBps = limitsResult.data.effectiveFeeRateBps ?? FEE_RATE_BPS;
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

    const feeIrt = feeIrtFor(amountIrt, feeRateBps);
    let amountCoin =
      (amountIrt - (side === "buy" ? feeIrt : 0)) / conversionPriceIrt;
    let amountCoinRaw: string | undefined;

    if (side === "buy") {
      if (amountIrt > availableIrt) {
        return fail("INSUFFICIENT_IRT", "موجودی تومانی شما کافی نیست.");
      }
    } else {
      // Balances are keyed by symbol (portfolio ids ≠ market ids for tokens).
      // Compare in EXACT decimal space, not on lossy floats: the check is
      // `amountIrt ≤ available × price` (issue #57). `available` is held minus
      // anything locked by open orders (issue #73). The «فروش همه» keypad enters
      // floor(held × price) Toman, so the derived amount can overshoot the held
      // units by a rounding hair — clamp that to a FULL sell (the exact held
      // string on the wire), but reject a real over-sell.
      const sym = coin.symbol.toUpperCase();
      const heldStr = coinAmountsRaw?.[sym] ?? String(coinAmounts[sym] ?? 0);
      const ZERO = BigInt(0);
      const heldScaled = toScaled(heldStr) ?? ZERO;
      const lockedScaled = toScaled(lockedCoinAmountsRaw?.[sym] ?? "0") ?? ZERO;
      const availScaled = availableScaled(heldScaled, lockedScaled);
      const priceScaled = toScaled(conversionPriceIrt) ?? ZERO;
      const ONE = toScaled("1")!; // 10^18
      // available notional (Toman) × 10^18, and the requested notional × 10^18.
      const availValueScaled = (availScaled * priceScaled) / ONE;
      const amountValueScaled = BigInt(Math.round(amountIrt)) * ONE;
      if (amountValueScaled > availValueScaled) {
        // Overshoot: clamp only a ≤0.5% «sell all» rounding artifact.
        if (
          amountValueScaled * BigInt(1000) <=
          availValueScaled * BigInt(1005)
        ) {
          amountCoinRaw = formatScaled(availScaled);
          amountCoin = parsePrice(amountCoinRaw) ?? amountCoin;
        } else {
          return fail("INSUFFICIENT_COIN", "موجودی این رمزارز کافی نیست.");
        }
      } else if (amountValueScaled === availValueScaled) {
        // Exactly all — send the precise held units, not the float re-derivation.
        amountCoinRaw = formatScaled(availScaled);
        amountCoin = parsePrice(amountCoinRaw) ?? amountCoin;
      }
    }

    return this.trade.placeOrder(
      coin,
      side,
      amountCoin,
      amountIrt,
      feeIrt,
      input.idempotencyKey,
      {
        orderType,
        targetPriceIrt,
        // Pass the user's tolerance through untouched — the backend decides how
        // it combines with the coin's own value (it wins).
        slippageBps: input.slippageBps ?? null,
        amountCoinRaw,
        quoteId: input.quoteId ?? null,
      },
    );
  }
}
