import { toEnglishDigits } from "@/lib/utils/digits";

/** One of the user's bank cards (the source of card-to-card deposits). */
export interface BankCard {
  id: string;
  number: string; // 16 digits, normalized Latin
}

/** Normalize a typed card number (Persian digits, spaces, dashes) to 16 digits, or null. */
export function normalizeCardNumber(value: string): string | null {
  const digits = toEnglishDigits(value).replace(/[\s-]/g, "");
  if (!/^\d{16}$/.test(digits)) return null;
  return digits;
}

/** Luhn check — Iranian bank cards validate with it. */
export function isValidCardNumber(value: string): boolean {
  const digits = normalizeCardNumber(value);
  if (!digits) return false;
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let d = Number(digits[i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}
