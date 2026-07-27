import type { RedeemedIncentive } from "@/lib/core/domain/incentives/incentive";
import type { ForfeitedLock } from "@/lib/core/domain/incentives/incentive-lock";

/** Form state for the redeem screen. `redeemed` is set on success. */
export interface RedeemFormState {
  error: string | null;
  redeemed: RedeemedIncentive | null;
}

export const initialRedeemFormState: RedeemFormState = {
  error: null,
  redeemed: null,
};

/** Form state for abandoning a locked gift. `forfeited` is set on success. */
export interface ForfeitFormState {
  error: string | null;
  forfeited: ForfeitedLock | null;
}

export const initialForfeitFormState: ForfeitFormState = {
  error: null,
  forfeited: null,
};
