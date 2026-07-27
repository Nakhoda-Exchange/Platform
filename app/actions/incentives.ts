"use server";

import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import type { RedeemFormState } from "./incentives-state";

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
