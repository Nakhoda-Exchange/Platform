"use server";

import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { toEnglishDigits } from "@/lib/utils/digits";
import type { ActionResult } from "./deposit-state";

/**
 * Request a Toman withdrawal to one of the user's IBANs (stays pending). When
 * the backend requires a `withdraw` OTP (issue #154), the caller passes the
 * `verification` it obtained from {@link requestWithdrawOtp}: the `challengeId`
 * bound server-side to THIS `{ amountIrt, ibanId }` plus the user-entered code.
 * Referencing the same `challengeId` (issue #69) is what proves the second
 * factor approved *this* withdrawal — not merely that the phone approved *a*
 * withdrawal — and the amount/IBAN sent here must match the bound challenge.
 * The code is validated authoritatively server-side.
 */
export async function requestIrtWithdraw(
  ibanId: string,
  amount: string,
  verification?: { challengeId: string; otp: string },
): Promise<ActionResult<{ id: string }>> {
  const amountIrt = Number(toEnglishDigits(amount).replace(/[^\d]/g, ""));

  // A second factor was collected: it must carry the challenge it was issued
  // against, so the backend can bind the code to this exact amount + IBAN.
  if (verification && !verification.challengeId) {
    return {
      ok: false,
      message: "درخواست کد تأیید نامعتبر است. دوباره تلاش کنید.",
    };
  }
  const code = verification
    ? toEnglishDigits(verification.otp).replace(/\D/g, "")
    : undefined;

  // NOTE (cross-subtree contract): the withdrawal endpoint must correlate this
  // code to the params-bound challenge. Today the backend does so via the
  // matching `{ amountIrt, ibanId }` carried on both the challenge (issue #154)
  // and this call, so a code minted for a different amount/IBAN won't verify.
  // For exact correlation the wallet withdraw path (WithdrawUseCase.irt →
  // WalletRepository.requestIrtWithdraw → POST /wallet/withdrawals/irt, owned by
  // the wallet subtree) should also forward `verification.challengeId`.
  const result = await container
    .resolve(TOKENS.WithdrawUseCase)
    .irt(ibanId, amountIrt, code);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: result.data };
}

/**
 * Send a purpose-bound `withdraw` OTP to the signed-in user's mobile (issue
 * #154), bound to the specific withdrawal parameters (issue #69). The mobile is
 * read from the authenticated profile server-side — never trusted from the
 * client — while `{ ibanId, amountIrt }` bind the challenge so the issued code
 * can only authorize *this* amount to *this* IBAN. Returns the `challengeId` the
 * caller must submit back on {@link requestIrtWithdraw}. Called only when
 * `withdraw.otpRequired` is on.
 *
 * Anti-abuse (SMS-bombing / brute force) is enforced by server-side rate
 * limiting on this endpoint (backend returns 429) — never by the client resend
 * timer, which is UX only (issue #69).
 */
export async function requestWithdrawOtp(params: {
  ibanId: string;
  amountIrt: number;
}): Promise<ActionResult<{ challengeId: string; resendAfterSeconds: number }>> {
  const profile = await container.resolve(TOKENS.GetProfileUseCase).execute();
  if (!profile.ok) {
    return {
      ok: false,
      message: "ارسال کد تأیید ناموفق بود. دوباره تلاش کنید.",
    };
  }
  const result = await container
    .resolve(TOKENS.RequestOtpUseCase)
    .execute(profile.data.mobile, "withdraw", {
      ibanId: params.ibanId,
      amountIrt: params.amountIrt,
    });
  if (!result.ok) return { ok: false, message: result.error.message };
  return {
    ok: true,
    data: {
      challengeId: result.data.challengeId,
      resendAfterSeconds: result.data.resendAfterSeconds,
    },
  };
}
