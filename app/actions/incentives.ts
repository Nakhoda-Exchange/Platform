"use server";

import { revalidatePath } from "next/cache";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import type { ForfeitFormState, RedeemFormState } from "./incentives-state";

/**
 * Redeem a gift/invite code for the signed-in user.
 *
 * Unlike the KYC path (where the code rides along with the inquiry and a failure
 * is silent), here redeeming IS the user's intent — so a failure is shown to
 * them verbatim, with the backend's Persian message explaining exactly why.
 */
export async function redeemIncentiveCode(
  _prev: RedeemFormState,
  formData: FormData,
): Promise<RedeemFormState> {
  const result = await container
    .resolve(TOKENS.RedeemIncentiveUseCase)
    .execute(String(formData.get("code") ?? ""));

  if (!result.ok) return { error: result.error.message, redeemed: null };
  return { error: null, redeemed: result.data };
}

/**
 * Give up an unvested gift so its withdrawal floor clears for good.
 *
 * Worth being precise about what this does and does not buy the user: it does
 * NOT free up more money right now — recovering X lowers both the balance and
 * the floor by X. What it ends is the encumbrance, so every Toman they deposit
 * afterwards is theirs to withdraw. That is what someone stuck behind terms they
 * can no longer meet actually needs.
 */
export async function forfeitIncentiveLock(
  _prev: ForfeitFormState,
  formData: FormData,
): Promise<ForfeitFormState> {
  const result = await container
    .resolve(TOKENS.IncentiveLocksUseCase)
    .forfeit(String(formData.get("lockId") ?? ""));

  if (!result.ok) return { error: result.error.message, forfeited: null };

  revalidatePath("/wallet/withdraw");
  return { error: null, forfeited: result.data };
}
