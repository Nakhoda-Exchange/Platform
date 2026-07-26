import { Mobile } from "@/lib/core/domain/auth/mobile";
import type {
  OtpBinding,
  OtpChallenge,
} from "@/lib/core/domain/auth/otp-challenge";
import type { OtpPurpose } from "@/lib/core/domain/auth/otp-purpose";
import type { Result } from "@/lib/core/domain/shared/result";
import type { AuthRepository } from "../ports/auth-repository.port";

/**
 * Requests an OTP for a raw mobile input. Validation is a domain concern
 * (`Mobile`), so the repository only ever sees a valid number. Resending is the
 * same operation, so it reuses this use case. `purpose` binds the code to a
 * flow (backend issue #155) — omitted ⇒ the backend defaults to `login`, so the
 * existing login/resend callers are unchanged; the withdrawal flow passes
 * `'withdraw'`. `binding` (backend issue #154) additionally ties the challenge
 * to specific operation parameters — e.g. the withdrawal amount + IBAN — so the
 * issued code can only authorize *that* operation, not merely the flow.
 */
export class RequestOtpUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(
    rawMobile: string,
    purpose?: OtpPurpose,
    binding?: OtpBinding,
  ): Promise<Result<OtpChallenge>> {
    const mobile = Mobile.create(rawMobile);
    if (!mobile.ok) return mobile;
    return this.authRepository.requestOtp(mobile.data, purpose, binding);
  }
}
