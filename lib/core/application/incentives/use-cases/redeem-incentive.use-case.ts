import type { RedeemedIncentive } from "@/lib/core/domain/incentives/incentive";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { IncentivesRepository } from "../ports/incentives-repository.port";

/**
 * Redeems a gift/invite code for the signed-in user. The backend owns every
 * business rule (expiry, capacity, one-per-user); this only rejects an empty
 * submission so a blank form never becomes a round-trip.
 */
export class RedeemIncentiveUseCase {
  constructor(private readonly incentives: IncentivesRepository) {}

  execute(rawCode: string): Promise<Result<RedeemedIncentive>> {
    const code = rawCode.trim();
    if (!code) {
      return Promise.resolve(fail("EMPTY_CODE", "کد را وارد کنید."));
    }
    return this.incentives.redeem(code);
  }
}
