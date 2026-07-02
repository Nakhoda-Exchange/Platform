import type { AuthSession } from "@/lib/core/domain/auth/auth-session";
import type { Result } from "@/lib/core/domain/shared/result";
import type { AuthRepository } from "../ports/auth-repository.port";

/** Verifies a submitted OTP code against a challenge id. */
export class VerifyOtpUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(challengeId: string, code: string): Promise<Result<AuthSession>> {
    return this.authRepository.verifyOtp(challengeId, code);
  }
}
