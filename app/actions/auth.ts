"use server";

import { redirect } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { cookies } from "next/headers";
import type { AuthFormState } from "./auth-state";
import { REFERRAL_COOKIE } from "./referral-state";

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

  // A shared referral link (?ref=CODE) rides the login form; keep it in an
  // httpOnly cookie until KYC completes, where the attribution is applied.
  const ref = String(formData.get("ref") ?? "").trim();
  if (/^[A-Za-z]{2,8}-\d{3,6}$/.test(ref)) {
    (await cookies()).set(REFERRAL_COOKIE, ref.toUpperCase(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
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
type LoginStatus = keyof typeof DESTINATION;

/** Clamp an untrusted status param to a known value. */
function asStatus(raw: string): LoginStatus {
  return raw in DESTINATION ? (raw as LoginStatus) : "registration";
}

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

  // Second step: users who set a two-step password must enter it before the
  // platform. Mock-only: the status travels in the URL like the OTP challenge
  // does; a real backend keeps it in the session.
  const profile = await container.resolve(TOKENS.GetProfileUseCase).execute();
  if (profile.ok && profile.data.twoFactorEnabled) {
    const phone = String(formData.get("phone") ?? "");
    const params = new URLSearchParams({ st: result.data.status, phone });
    redirect(`/login/two-step?${params.toString()}`);
  }

  redirect(DESTINATION[result.data.status]);
}

/**
 * Biometric variant of the gate: the device verified the user via WebAuthn
 * (client-side `navigator.credentials.get`). Mock: the assertion signature is
 * NOT re-verified here — that is backend work once auth sessions land; this
 * action only performs the redirect the password path would.
 */
export async function passTwoStepBiometric(status: string): Promise<void> {
  redirect(DESTINATION[asStatus(status)]);
}

/**
 * Step 3 (only when a two-step password is set) — verify it, then continue to
 * the status destination.
 */
export async function verifyTwoStepLogin(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const result = await container
    .resolve(TOKENS.TwoStepPasswordUseCase)
    .verify(password);

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect(DESTINATION[asStatus(String(formData.get("st") ?? ""))]);
}
