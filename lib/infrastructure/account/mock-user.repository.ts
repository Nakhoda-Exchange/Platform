import type { UserRepository } from "@/lib/core/application/account/ports/user-repository.port";
import type { UserProfile } from "@/lib/core/domain/account/profile";
import { fail, ok, type Result } from "@/lib/core/domain/shared/result";

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The mock «approved» login number (see MockAuthRepository) with a KYC-passed
// identity. Swap for an HTTP adapter in the composition root.
const PROFILE: Omit<UserProfile, "twoFactorEnabled"> = {
  name: "علی رضایی",
  mobile: "09111111111",
  kycVerified: true,
};

// Two-step password (per-process). null → 2FA off. Having one set is what the
// profile reports as twoFactorEnabled.
let TWO_STEP_PASSWORD: string | null = null;

export class MockUserRepository implements UserRepository {
  async getProfile(): Promise<Result<UserProfile>> {
    await delay();
    return ok({ ...PROFILE, twoFactorEnabled: TWO_STEP_PASSWORD !== null });
  }

  async setTwoStepPassword(password: string): Promise<Result<UserProfile>> {
    await delay();
    TWO_STEP_PASSWORD = password;
    return ok({ ...PROFILE, twoFactorEnabled: true });
  }

  async verifyTwoStepPassword(password: string): Promise<Result<void>> {
    await delay();
    if (TWO_STEP_PASSWORD === null || password !== TWO_STEP_PASSWORD) {
      return fail("WRONG_PASSWORD", "رمز دومرحله‌ای درست نیست.");
    }
    return ok(undefined);
  }
}
