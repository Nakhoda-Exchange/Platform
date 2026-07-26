/**
 * Exact decimal arithmetic for the trade path (issue #57).
 *
 * Balances and quantities travel as `numeric(38,18)` decimal STRINGS. Parsing
 * them to JS `number` drops digits past 2^53 and sub-unit precision, so a
 * boundary sell-sufficiency check or a «sell all» clamp computed on floats can
 * mis-accept or mis-reject. These helpers keep the value as a scaled BigInt
 * (×10^18) so the balance comparison and sell-all derivation are exact. Display
 * still formats floats — this is only for money-correct COMPARISON and CLAMP.
 */

/** Fixed scale for the scaled-BigInt representation — matches numeric(38,18). */
export const DECIMAL_SCALE = 18;
// `BigInt(...)` rather than an `n`-literal: the project targets ES2017, where
// tsc rejects BigInt literals (the BigInt global itself is available).
const ZERO = BigInt(0);
const SCALE_POW = BigInt(10) ** BigInt(DECIMAL_SCALE);

/**
 * A non-negative decimal string/number → its value × 10^18 as a BigInt,
 * truncating any fractional digits beyond scale 18. Returns `null` for a
 * malformed or negative input (callers treat that as "no usable balance").
 * A `number` is first expanded to a fixed-point string so a small memecoin
 * amount never arrives here in exponential form.
 */
export function toScaled(value: string | number): bigint | null {
  const s =
    typeof value === "number"
      ? Number.isFinite(value)
        ? value.toFixed(DECIMAL_SCALE)
        : ""
      : value.trim();
  if (s === "") return null;
  const match = /^(\d*)(?:\.(\d*))?$/.exec(s);
  if (!match) return null; // negative, exponential, or junk → unusable
  const intPart = match[1] || "0";
  const frac = (match[2] ?? "")
    .slice(0, DECIMAL_SCALE)
    .padEnd(DECIMAL_SCALE, "0");
  return BigInt(intPart) * SCALE_POW + BigInt(frac || "0");
}

/** A scaled BigInt (×10^18) back to a canonical decimal string (no trailing zeros). */
export function formatScaled(scaled: bigint): string {
  const neg = scaled < ZERO;
  const v = neg ? -scaled : scaled;
  const intPart = (v / SCALE_POW).toString();
  const frac = (v % SCALE_POW)
    .toString()
    .padStart(DECIMAL_SCALE, "0")
    .replace(/0+$/, "");
  return `${neg ? "-" : ""}${intPart}${frac ? `.${frac}` : ""}`;
}

/**
 * Compare two decimal strings/numbers exactly: `-1` (a < b), `0` (equal), `1`
 * (a > b), or `null` when either is malformed. No float rounding.
 */
export function compareDecimal(
  a: string | number,
  b: string | number,
): number | null {
  const A = toScaled(a);
  const B = toScaled(b);
  if (A === null || B === null) return null;
  return A < B ? -1 : A > B ? 1 : 0;
}

/** Available = max(held − locked, 0), all as scaled BigInts. */
export function availableScaled(held: bigint, locked: bigint): bigint {
  const diff = held - locked;
  return diff > ZERO ? diff : ZERO;
}
