import type { IdentityInquiryPort } from "@/lib/core/application/kyc/ports/identity-inquiry.port";
import type { Identity } from "@/lib/core/domain/kyc/identity";
import { ok, type Result } from "@/lib/core/domain/shared/result";

function delay(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * In-memory identity inquiry. Returns a canned identity for any valid national
 * code so the flow is drivable without a backend.
 *
 * ponytail: no "not found" branch here — a valid code always resolves. Add the
 * mismatch/not-found result when the real inquiry backend lands (it's in the PRD).
 */
export class MockIdentityInquiryRepository implements IdentityInquiryPort {
  // Params omitted: the mock resolves any valid code to the same identity.
  async inquire(): Promise<Result<Identity>> {
    await delay();
    return ok({
      firstName: "علی",
      lastName: "رضایی‌نژاد",
      fatherName: "محمد",
    });
  }
}
