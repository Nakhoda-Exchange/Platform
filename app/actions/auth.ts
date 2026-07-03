"use server";

import { redirect } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import type { AuthFormState } from "./auth-state";

function verifyUrl(phone: string, cid: string, resendSeconds: number): string {
  const params = new URLSearchParams({
    phone,
    cid,
    rs: String(resendSeconds),
  });
  return `/login/verify?${params.toString()}`;
}

/**
 * Step 1 — request an OTP for the submitted mobile, then move to verification.
 * Note: for this mock the phone + challenge travel in the URL. A real backend
 * would keep the challenge in an httpOnly session cookie instead.
 */
export async function startLogin(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const mobile = String(formData.get("mobile") ?? "");
  const result = await container
    .resolve(TOKENS.RequestOtpUseCase)
    .execute(mobile);

  if (!result.ok) {
    return { error: result.error.message };
  }

  const { challengeId, mobile: normalized, resendAfterSeconds } = result.data;
  redirect(verifyUrl(normalized, challengeId, resendAfterSeconds));
}

/** Resend the OTP for a mobile number, then reload the verify screen. */
export async function resendOtp(formData: FormData): Promise<void> {
  const mobile = String(formData.get("mobile") ?? "");
  const result = await container
    .resolve(TOKENS.RequestOtpUseCase)
    .execute(mobile);

  if (!result.ok) {
    redirect(verifyUrl(mobile, "", 120));
  }

  const { challengeId, resendAfterSeconds } = result.data;
  redirect(verifyUrl(mobile, challengeId, resendAfterSeconds));
}

/** Post-login destination for each user status. */
const DESTINATION = {
  registration: "/kyc",
  approved: "/market",
  declined: "/declined",
} as const;

/**
 * Step 2 — verify the submitted code. On success the login status decides where
 * the user goes: new users into KYC, approved users to the market, and declined
 * users to a dead-end page (they never reach the platform).
 */
export async function verifyLogin(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const challengeId = String(formData.get("cid") ?? "");
  const code = String(formData.get("code") ?? "");
  const result = await container
    .resolve(TOKENS.VerifyOtpUseCase)
    .execute(challengeId, code);

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect(DESTINATION[result.data.status]);
}
