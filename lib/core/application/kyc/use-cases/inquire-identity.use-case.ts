import type { Identity } from "@/lib/core/domain/kyc/identity";
import { NationalCode } from "@/lib/core/domain/kyc/national-code";
import { JalaliDate } from "@/lib/core/domain/kyc/jalali-date";
import { MIN_SIGNUP_AGE } from "@/lib/core/domain/kyc/signup-policy";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import { jalaliAgeInYears } from "@/lib/utils/jalali";
import { toPersianDigits } from "@/lib/utils/digits";
import type { IdentityInquiryPort } from "../ports/identity-inquiry.port";

/**
 * Validates the submitted identity inputs (via domain value objects), enforces
 * the minimum sign-up age, then runs the inquiry. Invite code is optional and
 * never blocks the inquiry.
 */
export class InquireIdentityUseCase {
  constructor(private readonly inquiry: IdentityInquiryPort) {}

  async execute(
    rawNationalCode: string,
    rawBirthDate: string,
  ): Promise<Result<Identity>> {
    const nationalCode = NationalCode.create(rawNationalCode);
    if (!nationalCode.ok) return nationalCode;

    const birthDate = JalaliDate.create(rawBirthDate);
    if (!birthDate.ok) return birthDate;

    const age = jalaliAgeInYears(birthDate.data.value);
    if (age === null || age < MIN_SIGNUP_AGE) {
      return fail(
        "UNDERAGE",
        `برای ثبت‌نام باید حداقل ${toPersianDigits(MIN_SIGNUP_AGE)} سال داشته باشید.`,
      );
    }

    return this.inquiry.inquire(nationalCode.data, birthDate.data);
  }

  /** Confirm the reviewed identity so the backend marks the user KYC-verified. */
  confirm(): Promise<Result<void>> {
    return this.inquiry.confirm();
  }
}
