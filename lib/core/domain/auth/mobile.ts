import { isValidIranMobile, toEnglishDigits } from "@/lib/utils/digits";
import { fail, ok, type Result } from "../shared/result";

/**
 * Value object for an Iranian mobile number. Construction validates and
 * normalizes, so anything downstream that holds a `Mobile` is guaranteed valid.
 */
export class Mobile {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Mobile> {
    const normalized = toEnglishDigits(raw).trim();
    if (!isValidIranMobile(normalized)) {
      return fail("INVALID_MOBILE", "شماره موبایل معتبر نیست.");
    }
    return ok(new Mobile(normalized));
  }

  toString(): string {
    return this.value;
  }
}
