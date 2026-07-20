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

// The lower an asset's price, the more decimals it needs to stay non-zero and
// keep ~4 significant figures. Capped so a truly tiny price (deep-sub-Toman
// memecoin) still renders its figures instead of collapsing to «۰», without
// running past JS float precision.
const SMART_DECIMALS_CAP = 12;

/**
 * Magnitude-aware fractional-digit count. `largeCap` is the max decimals once
 * |value| ≥ 1 (0 for IRT — a Toman ≥ 1 needs no fraction; 2 for coin amounts).
 * Below 1 we keep ~4 significant figures, capped at `SMART_DECIMALS_CAP` — so a
 * low-priced asset or memecoin amount like 0.0000000123 stays readable with real
 * precision instead of collapsing to 0.
 */
function smartDecimals(abs: number, largeCap: number): number {
  if (abs === 0 || abs >= 1) return largeCap;
  return Math.min(SMART_DECIMALS_CAP, Math.floor(-Math.log10(abs)) + 4);
}

// fa-IR formatters are ~µs to build but we format a lot; cache one per decimals.
const faFormatCache = new Map<number, Intl.NumberFormat>();
/** Persian grouped number with up to `maxDecimals` digits (trailing zeros dropped). */
function faDecimal(value: number, maxDecimals: number): string {
  let fmt = faFormatCache.get(maxDecimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat("fa-IR", {
      maximumFractionDigits: maxDecimals,
    });
    faFormatCache.set(maxDecimals, fmt);
  }
  return fmt.format(value);
}

/**
 * Persian grouped Toman. A value ≥ 1 shows NO fraction (whole Toman); only
 * sub-Toman prices (memecoins) keep smart decimals. Never renders "NaN"/"∞" —
 * a non-finite amount formats as zero.
 */
function faNumber(toman: number): string {
  if (!Number.isFinite(toman)) toman = 0;
  return faDecimal(toman, smartDecimals(Math.abs(toman), 0));
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

/** Change → Persian percent, unsigned magnitude (caller shows +/− and color): 3.2 → «۳٫۲٪». */
export function formatChangePercent(change: number): string {
  if (!Number.isFinite(change)) change = 0;
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

/**
 * Coin amount → Persian digits with magnitude-aware precision: a value ≥ 1 keeps
 * at most 2 decimals, while smaller amounts get more (~4 significant figures, up
 * to SMART_DECIMALS_CAP) so memecoin balances like 0.00001234 stay readable.
 * Grouped, trailing zeros dropped — 0.0015 → «۰٫۰۰۱۵», 5 → «۵», 1234.567 → «۱٬۲۳۴٫۵۷».
 */
export function formatCoinAmount(amount: number): string {
  if (!Number.isFinite(amount)) amount = 0;
  return faDecimal(amount, smartDecimals(Math.abs(amount), 2));
}
