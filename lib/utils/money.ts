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

/** Toman amount → «۱۲٬۴۵۰٬۰۰۰ تومان» (unit label from server config). */
export function formatIrt(toman: number): string {
  return `${faNumber(toman)} ${unit("irt")}`.trim();
}

/**
 * Toman amount for dense rows/cards. Product decision: the «ت» abbreviation
 * confused people — the unit is always spelled «تومان» now, so this is an
 * alias kept for the many call sites.
 */
export const formatIrtShort = formatIrt;

/** USD amount → «۴٬۱۲۰ دلار» (Persian digits; unit label from server config). */
export function formatUsd(usd: number): string {
  return `${toPersianDigits(usdFormat.format(usd)).replace(/,/g, "٬").replace(".", "٫")} ${unit("usd")}`.trim();
}

/** Signed 24h change → Persian percent, unsigned (the caller shows ▲/▼): 3.2 → «۳٫۲٪». */
export function formatChangePercent(change: number): string {
  return `${toPersianDigits(Math.abs(change).toFixed(1)).replace(".", "٫")}٪`;
}

/** Market cap → «۸۵٬۰۰۰ همت» (unit label from server config). */
export function formatMarketCap(hemat: number): string {
  return `${irtFormat.format(Math.round(hemat))} ${unit("marketCap")}`.trim();
}

/** Coin amount held → Persian digits, e.g. 0.0015 → «۰٫۰۰۱۵», 5 → «۵». */
export function formatCoinAmount(amount: number): string {
  if (amount >= 1000) return irtFormat.format(amount);
  return toPersianDigits(String(amount)).replace(".", "٫");
}
