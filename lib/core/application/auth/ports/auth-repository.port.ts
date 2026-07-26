import type { Mobile } from "@/lib/core/domain/auth/mobile";
import type {
  OtpBinding,
  OtpChallenge,
} from "@/lib/core/domain/auth/otp-challenge";
import type { OtpPurpose } from "@/lib/core/domain/auth/otp-purpose";
import type { AuthSession } from "@/lib/core/domain/auth/auth-session";
import type { Result } from "@/lib/core/domain/shared/result";

/**
 * Port (driven interface) for authentication. The application layer depends on
 * this abstraction only; concrete adapters live in the infrastructure layer.
 */
export interface AuthRepository {
  /**
   * Issue an OTP challenge for a validated mobile number. `purpose` binds the
   * code to a flow (backend issue #155) — omitted ⇒ the backend defaults to
   * `login`, so existing login callers are unchanged. `binding` further ties the
   * challenge to specific operation parameters (backend issue #154) — e.g. a
   * withdraw code bound to its exact amount + destination IBAN — so the returned
   * `challengeId` can only authorize *that* operation.
   */
  requestOtp(
    mobile: Mobile,
    purpose?: OtpPurpose,
    binding?: OtpBinding,
  ): Promise<Result<OtpChallenge>>;
  /** Verify a submitted code against a challenge. */
  verifyOtp(challengeId: string, code: string): Promise<Result<AuthSession>>;
}
