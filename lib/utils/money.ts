import { toPersianDigits } from "./digits";

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

/** Toman amount → «۱۲٬۴۵۰٬۰۰۰ تومان» (spelled unit; for prominent single prices). */
export function formatIrt(toman: number): string {
  return `${faNumber(toman)} تومان`;
}

/** Toman amount → «۱۲٬۴۵۰٬۰۰۰ ت» (short unit; for dense market rows/cards). */
export function formatIrtShort(toman: number): string {
  return `${faNumber(toman)} ت`;
}

/** USD amount → «$4,120» (Latin digits, LTR). */
export function formatUsd(usd: number): string {
  return `$${usdFormat.format(usd)}`;
}

/** Signed 24h change → Persian percent, unsigned (the caller shows ▲/▼): 3.2 → «۳٫۲٪». */
export function formatChangePercent(change: number): string {
  return `${toPersianDigits(Math.abs(change).toFixed(1)).replace(".", "٫")}٪`;
}

/** Market cap in همت → «۸۵٬۰۰۰ همت». */
export function formatMarketCap(hemat: number): string {
  return `${irtFormat.format(Math.round(hemat))} همت`;
}
