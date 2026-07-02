import type { AuthRepository } from "@/lib/core/application/auth/ports/auth-repository.port";
import type { Mobile } from "@/lib/core/domain/auth/mobile";
import type { OtpChallenge } from "@/lib/core/domain/auth/otp-challenge";
import type { AuthSession } from "@/lib/core/domain/auth/auth-session";
import { fail, ok, type Result } from "@/lib/core/domain/shared/result";
import { toEnglishDigits } from "@/lib/utils/digits";

interface StoredChallenge {
  mobile: string;
  code: string;
  resendAfterSeconds: number;
}

const RESEND_AFTER_SECONDS = 120;
const MOCK_CODE = "123456";

/** Simulates network latency so the mock behaves like a real backend. */
function delay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * In-memory adapter. Challenge ids are opaque UUIDs mapped to their stored
 * state — nothing about the mobile is encoded in the id. Swap this for an
 * HTTP-backed adapter (registered in the DI composition root) once the backend
 * exists; note the in-process Map is per-instance and not production-shaped.
 */
export class MockAuthRepository implements AuthRepository {
  private readonly challenges = new Map<string, StoredChallenge>();

  async requestOtp(mobile: Mobile): Promise<Result<OtpChallenge>> {
    await delay();
    const challengeId = crypto.randomUUID();
    this.challenges.set(challengeId, {
      mobile: mobile.value,
      code: MOCK_CODE, // a real backend sends this via SMS
      resendAfterSeconds: RESEND_AFTER_SECONDS,
    });
    return ok({
      challengeId,
      mobile: mobile.value,
      resendAfterSeconds: RESEND_AFTER_SECONDS,
    });
  }

  async verifyOtp(
    challengeId: string,
    code: string,
  ): Promise<Result<AuthSession>> {
    await delay();
    const challenge = this.challenges.get(challengeId);
    if (!challenge || toEnglishDigits(code).trim() !== challenge.code) {
      return fail("INVALID_CODE", "کد وارد شده صحیح نیست.");
    }

    this.challenges.delete(challengeId);
    return ok({
      userId: `user_${challenge.mobile}`,
      mobile: challenge.mobile,
      token: "mock-session-token",
    });
  }
}
