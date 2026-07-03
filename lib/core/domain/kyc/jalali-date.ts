import { fail, ok, type Result } from "../shared/result";
import { normalizeJalaliDate } from "@/lib/utils/jalali";

/**
 * A Jalali (شمسی) birth date value object. Parsing/validation lives in the
 * shared `lib/utils/jalali` util (reusable elsewhere); this wraps it so the
 * domain layer stays the source of validity, mirroring `Mobile` → `digits`.
 *
 * ponytail: plain masked text entry, not a calendar picker. Add a Jalali picker
 * only if the UX needs one — the util's format/range check covers entry today.
 */
export class JalaliDate {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<JalaliDate> {
    const normalized = normalizeJalaliDate(raw);
    if (!normalized) {
      return fail(
        "INVALID_BIRTHDATE",
        "تاریخ تولد را به شکل ۱۳۷۵/۰۵/۱۲ وارد کنید.",
      );
    }
    return ok(new JalaliDate(normalized));
  }

  toString(): string {
    return this.value;
  }
}
