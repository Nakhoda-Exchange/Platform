import type { UserProfile } from "@/lib/core/domain/account/profile";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { UserRepository } from "../ports/user-repository.port";
import { toEnglishDigits } from "@/lib/utils/digits";

/**
 * Turns two-step verification on/off after verifying the SMS code.
 * Mock: the code is always 123456 (same as the login OTP mock).
 */
export class SetTwoFactorUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(code: string, enabled: boolean): Promise<Result<UserProfile>> {
    if (toEnglishDigits(code).trim() !== "123456") {
      return fail("INVALID_CODE", "کد وارد شده صحیح نیست.");
    }
    return this.users.setTwoFactor(enabled);
  }
}
