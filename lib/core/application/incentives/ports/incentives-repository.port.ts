import type { RedeemedIncentive } from "@/lib/core/domain/incentives/incentive";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for redeeming growth incentive codes. Adapters live in infrastructure. */
export interface IncentivesRepository {
  redeem(code: string): Promise<Result<RedeemedIncentive>>;
}
