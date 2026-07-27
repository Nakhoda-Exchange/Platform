/**
 * The pre-commit quote for a trade (`POST /v1/trade/quotes`) — what the backend
 * says this exact order would cost right now, without committing to it.
 *
 * Today the screen reads one figure from it: the expected slippage. The shape is
 * an object (not a bare number) because the same call already prices fees and
 * the amount out — those can be surfaced here later without a new round-trip.
 */
export interface TradeQuote {
  /**
   * Expected price impact of routing this size right now, in basis points.
   *
   * - a positive number — the market moves this much against the order;
   * - `0` — a firm-price route (the exchange's own inventory, or a CEX quote
   *   inside its validity window): a real answer, not a missing one;
   * - `null` — the backend could not price a route (venue down, no liquidity,
   *   routing not wired). Nothing is shown; never rendered as zero.
   *
   * This is an ESTIMATE for display, not a guarantee — the order's own price
   * band is what actually bounds the fill.
   */
  expectedSlippageBps: number | null;

  /**
   * Server-minted quote reference (issue #59). When the backend returns a
   * fixed-price quote — `quoteId` + a locked `priceIrt` valid until `expiresAt`
   * — the order references it (see {@link PlaceOrderOptions.quoteId}) so the
   * house, not the user, bears intra-TTL slippage. All optional: an older
   * backend that only prices slippage omits them, and the order falls back to
   * the price-band model. `null`/absent ⇒ no server-minted quote available.
   */
  quoteId?: string | null;
  /** The fixed unit price this quote locks, whole Toman per coin. */
  priceIrt?: number | null;
  /** When the fixed price stops being honoured (ISO-8601). Past it → re-quote. */
  expiresAt?: string | null;
  /**
   * The caller's EFFECTIVE fee rate for this quote, basis points (issue #76). A
   * caller may be discounted, so the fixed FEE_RATE would mismatch; the
   * quote is a natural carrier for the real rate. `null`/absent ⇒ unknown here.
   */
  feeRateBps?: number | null;
}

/** Whether a server-minted quote's fixed price is still valid at `now`. */
export function isQuoteExpired(
  expiresAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!expiresAt) return false; // no expiry advertised ⇒ not expiring
  const t = Date.parse(expiresAt);
  return Number.isFinite(t) && t <= now;
}

/**
 * Slippage below this is too small to state as a percentage — it would render
 * «٪۰٫۰۱»-and-under noise that reads as false precision on a retail screen.
 * Such a route is described as effectively slippage-free instead.
 */
export const NEGLIGIBLE_SLIPPAGE_BPS = 1;

/** Whether a quote's slippage is worth stating as a number to the user. */
export function hasMeaningfulSlippage(bps: number | null): bps is number {
  return bps !== null && bps >= NEGLIGIBLE_SLIPPAGE_BPS;
}
