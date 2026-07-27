/**
 * Money on the wire. The REST price contract serializes coin prices as decimal
 * STRINGS that may be `null` when there is no fresh price: `priceIrt`/`priceUsd`
 * on a {@link ./coin Coin} and `high24h`/`low24h` on a coin detail. `null` means
 * UNAVAILABLE — it must NEVER be shown as `0` and NEVER as a stale figure. The
 * raw string is carried end-to-end (full precision) and parsed only for
 * formatting or computation. Live WebSocket ticks stay NUMERIC and are unaffected.
 */
export type PriceValue = string | number | null | undefined;

/**
 * Parse a wire price (decimal string, or a number such as a live tick) into a
 * finite number, or `null` when the price is unavailable / unparseable.
 *
 * Full precision is preserved (`Number` on the raw string). Crucially, an empty
 * string, `null`/`undefined`, `NaN`, and `±Infinity` all map to `null` — so a
 * missing price can never silently become a misleading `0` (note `Number("")`
 * is `0`, which is exactly the trap this guards).
 */
export function parsePrice(value: PriceValue): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    if (value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return Number.isFinite(value) ? value : null;
}

/** Whether a wire price actually carries a usable figure (vs. unavailable). */
export function hasPrice(value: PriceValue): boolean {
  return parsePrice(value) !== null;
}

/** A plain non-negative decimal — no exponent, which the backend also accepts
 *  but which is needlessly lossy to produce from a rounded number. */
const PLAIN_DECIMAL = /^\d+(\.\d+)?$/;

/**
 * A price formatted for the ORDER wire: an exact plain decimal string, or `null`
 * when there is no usable price.
 *
 * Rounding to whole Toman here is what made cheap coins untradeable (issue
 * #111). BONK trades at ~0.593 IRT, so `Math.round` sent `1` — a 68% deviation
 * from the market price the backend guards against, and every single BONK order
 * came back `PRICE_OUT_OF_TOLERANCE` no matter what the user did.
 *
 * The raw wire string is passed through untouched when it is already a plain
 * decimal: it came from the backend at full precision, and re-deriving it from
 * the parsed `number` would only add float noise. The numeric path exists for
 * live WebSocket ticks, and uses `toFixed` rather than `String` because
 * `String(0.0000028)` yields `"2.8e-6"`.
 */
export function toPriceWire(value: PriceValue): string | null {
  const parsed = parsePrice(value);
  if (parsed === null || parsed <= 0) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (PLAIN_DECIMAL.test(trimmed)) return trimmed;
  }
  const fixed = parsed.toFixed(18).replace(/\.?0+$/, "");
  return fixed === "" || fixed === "0" ? null : fixed;
}
