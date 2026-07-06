import type { CurrencyUnits } from "@/lib/core/domain/config/currency-units";
import { toPersianDigits } from "./digits";

// Unit labels are SERVER CONFIG (ConfigRepository) — injected once by the
// root layout (server) and CurrencyUnitsHydrator (client) before anything
// renders amounts. Never hardcode a unit here.
let UNITS: CurrencyUnits | null = null;

export function setCurrencyUnits(units: CurrencyUnits): void {
  UNITS = units;
}

const unit = (key: keyof CurrencyUnits): string => UNITS?.[key] ?? "";

/**
 * Unit visually LEFT of the number in every bidi context (RTL paragraphs and
 * dir=ltr spans alike): number-first logical order wrapped in an RTL isolate
 * (U+2067…U+2069) — Arabic-Indic digits are bidi class AN, so inside the RTL
 * isolate the digits render rightmost and the unit lands on their left,
 * regardless of the surrounding direction.
 */
const unitFirst = (label: string, number: string): string =>
  label ? `\u2067${number} ${label}\u2069` : number;

const irtFormat = new Intl.NumberFormat("fa-IR");
const usdFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Persian grouped number; small fractional prices (memecoins) keep 2 decimals. */
function faNumber(toman: number): string {
  if (
    Math.abs(toman) > 0 &&
    Math.abs(toman) < 1000 &&
    !Number.isInteger(toman)
  ) {
    return toPersianDigits(toman.toFixed(2)).replace(".", "٫");
  }
  return irtFormat.format(Math.round(toman));
}

/** Toman amount → «تومان ۱۲٬۴۵۰٬۰۰۰» (unit left of the number; label from server config). */
export function formatIrt(toman: number): string {
  return unitFirst(unit("irt"), faNumber(toman));
}

/**
 * Toman amount for dense rows/cards. Product decision: the «ت» abbreviation
 * confused people — the unit is always spelled «تومان» now, so this is an
 * alias kept for the many call sites.
 */
export const formatIrtShort = formatIrt;

/** USD amount → «دلار ۴٬۱۲۰» (unit left of the number; label from server config). */
export function formatUsd(usd: number): string {
  const number = toPersianDigits(usdFormat.format(usd))
    .replace(/,/g, "٬")
    .replace(".", "٫");
  return unitFirst(unit("usd"), number);
}

/** Signed 24h change → Persian percent, unsigned (the caller shows ▲/▼): 3.2 → «۳٫۲٪». */
export function formatChangePercent(change: number): string {
  return `${toPersianDigits(Math.abs(change).toFixed(1)).replace(".", "٫")}٪`;
}

/**
 * Market cap → «۸۵٬۰۰۰ همت». «همت» is NOT a currency unit — it is the common
 * shorthand for «هزار میلیارد تومان» (a scale word, like «میلیون»), so it is
 * vocabulary here, not server config. Same RTL isolate as the money
 * formatters so the word sits left of the digits everywhere.
 */
export function formatMarketCap(hemat: number): string {
  return `\u2067${irtFormat.format(Math.round(hemat))} همت\u2069`;
}

/** Coin amount held → Persian digits, e.g. 0.0015 → «۰٫۰۰۱۵», 5 → «۵». */
export function formatCoinAmount(amount: number): string {
  if (amount >= 1000) return irtFormat.format(amount);
  return toPersianDigits(String(amount)).replace(".", "٫");
}
