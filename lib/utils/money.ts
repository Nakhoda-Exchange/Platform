import { toPersianDigits } from "./digits";

const irtFormat = new Intl.NumberFormat("fa-IR");
const usdFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Toman amount → grouped Persian digits + unit, e.g. 12450000 → «۱۲٬۴۵۰٬۰۰۰ تومان». */
export function formatIrt(toman: number): string {
  return `${irtFormat.format(Math.round(toman))} تومان`;
}

/** USD amount → «$4,120» (Latin digits, LTR). */
export function formatUsd(usd: number): string {
  return `$${usdFormat.format(usd)}`;
}

/** Signed 24h change → Persian percent, unsigned (the caller shows ▲/▼): 3.2 → «۳٫۲٪». */
export function formatChangePercent(change: number): string {
  return `${toPersianDigits(Math.abs(change).toFixed(1)).replace(".", "٫")}٪`;
}
