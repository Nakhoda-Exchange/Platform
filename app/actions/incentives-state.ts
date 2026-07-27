import type { RedeemedIncentive } from "@/lib/core/domain/incentives/incentive";

/** Form state for the redeem screen. `redeemed` is set on success. */
export interface RedeemFormState {
  error: string | null;
  redeemed: RedeemedIncentive | null;
}

export const initialRedeemFormState: RedeemFormState = {
  error: null,
  redeemed: null,
};
