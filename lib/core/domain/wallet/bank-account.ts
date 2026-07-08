import { toEnglishDigits } from "@/lib/utils/digits";

/**
 * Verification status of a saved payout instrument (card or IBAN). A real
 * backend flips this to "verified" once the bank inquiry confirms ownership;
 * the mock verifies synchronously on add, so it is only ever "verified" there.
 */
export type BankAccountStatus = "verified" | "pending";

/** One of the user's saved IBANs (شبا) — a Toman withdrawal destination. */
export interface Iban {
  id: string;
  value: string; // "IR" + 24 digits, normalized
  ownerName: string; // registered holder from the bank inquiry
  primary: boolean; // auto-selected when the user has several
  status: BankAccountStatus;
}

/** Normalize a typed IBAN (with/without "IR", Persian digits, spaces) to "IR"+24 digits, or null. */
export function normalizeIban(value: string): string | null {
  let s = toEnglishDigits(value).toUpperCase().replace(/[\s-]/g, "");
  if (s.startsWith("IR")) s = s.slice(2);
  if (!/^\d{24}$/.test(s)) return null;
  return `IR${s}`;
}

/** Iranian IBAN checksum (ISO 13616 / mod-97). */
export function isValidIban(value: string): boolean {
  const normalized = normalizeIban(value);
  if (!normalized) return false;
  // Move the 4-char prefix to the end, map letters to numbers (A=10..Z=35),
  // then the whole number mod 97 must equal 1.
  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const chunk = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const d of chunk) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}

/**
 * Ownership gate for adding a card/IBAN: the instrument's registered holder
 * must match the KYC'd account holder. Compares Persian names leniently —
 * collapse ZWNJ/whitespace, then exact match.
 */
export function sameOwner(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/‌/g, " ").replace(/\s+/g, " ").trim();
  return norm(a).length > 0 && norm(a) === norm(b);
}
