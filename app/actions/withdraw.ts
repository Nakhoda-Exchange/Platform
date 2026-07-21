"use server";

import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { toEnglishDigits } from "@/lib/utils/digits";
import type { ActionResult } from "./deposit-state";

/**
 * Request a Toman withdrawal to one of the user's IBANs (stays pending). When
 * the backend requires it (issue #154) a purpose-bound `withdraw` OTP is passed
 * through; the code is validated authoritatively server-side.
 */
export async function requestIrtWithdraw(
  ibanId: string,
  amount: string,
  otp?: string,
): Promise<ActionResult<{ id: string }>> {
  const amountIrt = Number(toEnglishDigits(amount).replace(/[^\d]/g, ""));
  const code = otp ? toEnglishDigits(otp).replace(/\D/g, "") : undefined;
  const result = await container
    .resolve(TOKENS.WithdrawUseCase)
    .irt(ibanId, amountIrt, code);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: result.data };
}

/**
 * Send a purpose-bound `withdraw` OTP to the signed-in user's mobile (issue
 * #154). The mobile is read from the authenticated profile server-side — never
 * trusted from the client. Called only when `withdraw.otpRequired` is on.
 */
export async function requestWithdrawOtp(): Promise<
  ActionResult<{ resendAfterSeconds: number }>
> {
  const profile = await container.resolve(TOKENS.GetProfileUseCase).execute();
  if (!profile.ok) {
    return {
      ok: false,
      message: "ارسال کد تأیید ناموفق بود. دوباره تلاش کنید.",
    };
  }
  const result = await container
    .resolve(TOKENS.RequestOtpUseCase)
    .execute(profile.data.mobile, "withdraw");
  if (!result.ok) return { ok: false, message: result.error.message };
  return {
    ok: true,
    data: { resendAfterSeconds: result.data.resendAfterSeconds },
  };
}
