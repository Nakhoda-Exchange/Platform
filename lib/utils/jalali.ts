import { isValidJalaaliDate, toGregorian, toJalaali } from "jalaali-js";
import { toEnglishDigits, toPersianDigits } from "./digits";

/** Plausible birth-year window for a Jalali date field. */
const MIN_YEAR = 1300;
const MAX_YEAR = 1450;

/**
 * Parse/validate a Jalali date in `YYYY/MM/DD` (Persian or Latin digits, `-` or
 * `/` separators). Returns the normalized `YYYY/MM/DD` string, or `null` if it
 * isn't a real Jalali date. Calendar validity (month lengths, leap years) is
 * delegated to `jalaali-js`. Global util — reuse instead of re-parsing dates.
 */
export function normalizeJalaliDate(value: string): string | null {
  const s = toEnglishDigits(value).trim().replace(/-/g, "/");
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(s);
  if (!m) return null;

  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (jy < MIN_YEAR || jy > MAX_YEAR) return null;
  if (!isValidJalaaliDate(jy, jm, jd)) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

/** True when `value` is a well-formed Jalali date. */
export function isValidJalaliDate(value: string): boolean {
  return normalizeJalaliDate(value) !== null;
}

/**
 * Live input mask for a `YYYY/MM/DD` field: keeps the digits the user typed
 * (Persian or Latin), caps at 8, and auto-inserts the `/` separators. Preserves
 * digit script so a Persian typist keeps seeing Persian digits.
 *
 * ponytail: append-at-end only. Mid-string edits can jump the caret — a mask
 * lib fixes that, but it's not worth a dependency for one birth-date field.
 */
export function maskJalaliDate(value: string): string {
  const d = value.replace(/[^0-9۰-۹]/g, "").slice(0, 8);
  return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)]
    .filter(Boolean)
    .join("/");
}

/**
 * Whole years between a Jalali birth date and `now`, or `null` if the date is
 * malformed. `now` is injectable so callers (and tests) stay deterministic.
 */
export function jalaliAgeInYears(
  value: string,
  now: Date = new Date(),
): number | null {
  const norm = normalizeJalaliDate(value);
  if (!norm) return null;

  const [jy, jm, jd] = norm.split("/").map(Number);
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  let age = now.getFullYear() - gy;
  const monthDiff = now.getMonth() + 1 - gm;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < gd)) age--;
  return age;
}

/** Jalali month names, 1-indexed via JALALI_MONTHS[jm - 1]. */
export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** A Date → its Jalali day label, e.g. «۱۳ تیر ۱۴۰۵». */
export function formatJalaliDay(date: Date): string {
  const { jy, jm, jd } = toJalaali(date);
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

/** A Date → Persian-digit `HH:MM`, e.g. «۱۴:۰۵». */
export function formatTimeFa(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return toPersianDigits(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
}
