import type { Mobile } from "@/lib/core/domain/auth/mobile";
import type { OtpChallenge } from "@/lib/core/domain/auth/otp-challenge";
import type { AuthSession } from "@/lib/core/domain/auth/auth-session";
import type { Result } from "@/lib/core/domain/shared/result";

/**
 * Port (driven interface) for authentication. The application layer depends on
 * this abstraction only; concrete adapters live in the infrastructure layer.
 */
export interface AuthRepository {
  /** Issue an OTP challenge for a validated mobile number. */
  requestOtp(mobile: Mobile): Promise<Result<OtpChallenge>>;
  /** Verify a submitted code against a challenge. */
  verifyOtp(challengeId: string, code: string): Promise<Result<AuthSession>>;
}
