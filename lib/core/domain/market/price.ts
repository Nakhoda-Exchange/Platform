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
