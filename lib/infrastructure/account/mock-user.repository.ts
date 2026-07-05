import type { UserRepository } from "@/lib/core/application/account/ports/user-repository.port";
import type { UserProfile } from "@/lib/core/domain/account/profile";
import { ok, type Result } from "@/lib/core/domain/shared/result";

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The mock «approved» login number (see MockAuthRepository) with a KYC-passed
// identity. Swap for an HTTP adapter in the composition root.
const PROFILE: UserProfile = {
  name: "علی رضایی",
  mobile: "09111111111",
  kycVerified: true,
  twoFactorEnabled: false,
};

export class MockUserRepository implements UserRepository {
  async getProfile(): Promise<Result<UserProfile>> {
    await delay();
    return ok({ ...PROFILE });
  }

  async setTwoFactor(enabled: boolean): Promise<Result<UserProfile>> {
    await delay();
    PROFILE.twoFactorEnabled = enabled;
    return ok({ ...PROFILE });
  }
}
