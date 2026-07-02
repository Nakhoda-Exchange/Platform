const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Normalizes Persian/Arabic numerals in a string to Latin digits. */
export function toEnglishDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (char) => {
    const persian = PERSIAN_DIGITS.indexOf(char);
    if (persian > -1) return String(persian);
    return String(ARABIC_DIGITS.indexOf(char));
  });
}

/** Renders Latin digits as Persian numerals for display. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** Iranian mobile number, e.g. 09123456789 (accepts Persian digits too). */
export function isValidIranMobile(value: string): boolean {
  return /^09\d{9}$/.test(toEnglishDigits(value).trim());
}

/** Masks a mobile for display: 09123456789 → ۰۹۱۲•••۴۵۶۷ */
export function maskMobile(value: string): string {
  const digits = toEnglishDigits(value).trim();
  if (digits.length < 8) return toPersianDigits(digits);
  return `${toPersianDigits(digits.slice(0, 4))}•••${toPersianDigits(digits.slice(-4))}`;
}
