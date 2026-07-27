import type { RedeemedIncentive } from "@/lib/core/domain/incentives/incentive";
import type {
  ForfeitedLock,
  IncentiveLocks,
} from "@/lib/core/domain/incentives/incentive-lock";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for growth incentive codes and their locks. Adapters live in infrastructure. */
export interface IncentivesRepository {
  redeem(code: string): Promise<Result<RedeemedIncentive>>;
  /** Gifts the user has been paid but cannot withdraw yet. */
  locks(): Promise<Result<IncentiveLocks>>;
  /** Abandon a lock to clear its withdrawal floor permanently. */
  forfeitLock(id: string): Promise<Result<ForfeitedLock>>;
}
