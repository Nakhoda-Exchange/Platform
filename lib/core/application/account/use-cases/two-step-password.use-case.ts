import type { UserProfile } from "@/lib/core/domain/account/profile";
import { isStrongPassword } from "@/lib/core/domain/account/two-step-password";
import { NationalCode } from "@/lib/core/domain/kyc/national-code";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { UserRepository } from "../ports/user-repository.port";
import { normalizeJalaliDate } from "@/lib/utils/jalali";
import { toEnglishDigits } from "@/lib/utils/digits";

/**
 * The two-step password lifecycle. Set from the profile; verified at the
 * login gate (asked only when one is set); reset by matching the user's
 * national code + birth date plus an SMS code (mock: 123456).
 * All rules are enforced here — the authoritative check.
 */
export class TwoStepPasswordUseCase {
  constructor(private readonly users: UserRepository) {}

  async set(password: string, confirm: string): Promise<Result<UserProfile>> {
    if (!isStrongPassword(password)) {
      return fail(
        "WEAK_PASSWORD",
        "رمز باید حداقل ۸ کاراکتر و شامل حرف بزرگ، حرف کوچک و عدد باشد.",
      );
    }
    if (password !== confirm) {
      return fail("PASSWORD_MISMATCH", "تکرار رمز با رمز یکسان نیست.");
    }
    return this.users.setTwoStepPassword(password);
  }

  verify(password: string): Promise<Result<void>> {
    return this.users.verifyTwoStepPassword(password);
  }

  async reset(
    nationalCode: string,
    birthDate: string,
    smsCode: string,
    password: string,
    confirm: string,
  ): Promise<Result<UserProfile>> {
    const code = NationalCode.create(nationalCode);
    if (!code.ok) return code;
    if (!normalizeJalaliDate(birthDate)) {
      return fail("INVALID_BIRTHDATE", "تاریخ تولد درست نیست.");
    }
    if (toEnglishDigits(smsCode).trim() !== "123456") {
      return fail("INVALID_CODE", "کد وارد شده صحیح نیست.");
    }
    return this.set(password, confirm);
  }
}
