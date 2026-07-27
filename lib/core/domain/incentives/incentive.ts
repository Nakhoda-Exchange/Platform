/** When a redeemed code actually pays out — decided per campaign by an admin. */
export type PayoutTrigger = "instant" | "after_kyc" | "after_first_trade";

/**
 * The result of redeeming a growth incentive code. `amount` is an exact decimal
 * string (never a number — memecoin amounts lose precision past 2^53), and
 * `symbol` is the display ticker («IRT», «SHIB»).
 */
export interface RedeemedIncentive {
  redemptionId: string;
  asset: string;
  symbol: string;
  amount: string;
  trigger: PayoutTrigger;
  /** True when the reward is already in the wallet; false ⇒ awaiting the trigger. */
  credited: boolean;
}
