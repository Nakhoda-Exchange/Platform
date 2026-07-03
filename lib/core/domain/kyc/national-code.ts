import { fail, ok, type Result } from "../shared/result";
import { toEnglishDigits } from "@/lib/utils/digits";

/**
 * Iranian national code (کد ملی). Construction validates length + the official
 * checksum, so holding a `NationalCode` guarantees a well-formed value.
 */
export class NationalCode {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<NationalCode> {
    const digits = toEnglishDigits(raw).replace(/\D/g, "");
    if (!isValidNationalCode(digits)) {
      return fail("INVALID_NATIONAL_CODE", "کد ملی نامعتبر است.");
    }
    return ok(new NationalCode(digits));
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Official Iranian national-code check: 10 digits, not all-identical, and the
 * last digit matches the weighted checksum of the first nine.
 */
export function isValidNationalCode(raw: string): boolean {
  const d = toEnglishDigits(raw).replace(/\D/g, "");
  if (!/^\d{10}$/.test(d)) return false;
  if (/^(\d)\1{9}$/.test(d)) return false; // 0000000000, 1111111111, …

  const check = Number(d[9]);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
  const r = sum % 11;
  return r < 2 ? check === r : check === 11 - r;
}
