"use server";

import { redirect } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { cookies } from "next/headers";
import type { AuthFormState } from "./auth-state";
import { REFERRAL_COOKIE } from "./referral-state";
import { SESSION_COOKIE, safeNextPath } from "./session-state";
import {
  clearLoginChallenge,
  clearLoginStatus,
  readLoginChallenge,
  readLoginStatus,
  setLoginChallenge,
  setLoginStatus,
} from "./login-flow-state";

/**
 * Start the login session (issue #78). Opaque presence cookie until full
 * auth sessions land — set ONLY at true login success: OTP for users
 * without a two-step password, the gate for users with one.
 */
async function startSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/**
 * Step 1 — request an OTP for the submitted mobile, then move to verification.
 * The challenge (phone + challenge id + resend timer) is stashed in an httpOnly
 * cookie, not the URL, so it can't be tampered with, shared, or lost on reload.
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
  await setLoginChallenge({
    cid: challengeId,
    phone: normalized,
    rs: resendAfterSeconds,
    next: safeNextPath(String(formData.get("next") ?? "")),
  });
  redirect("/login/verify");
}

/** Resend the OTP for a mobile number, then reload the verify screen. */
export async function resendOtp(formData: FormData): Promise<void> {
  const mobile = String(formData.get("mobile") ?? "");
  const existing = await readLoginChallenge();
  const result = await container
    .resolve(TOKENS.RequestOtpUseCase)
    .execute(mobile);

  // On failure keep the current challenge so the user can retry from verify.
  if (result.ok) {
    const { challengeId, mobile: normalized, resendAfterSeconds } = result.data;
    await setLoginChallenge({
      cid: challengeId,
      phone: normalized,
      rs: resendAfterSeconds,
      next: existing?.next ?? null,
    });
  }
  redirect("/login/verify");
}

/** Post-login destination for each user status. */
const DESTINATION = {
  registration: "/kyc",
  approved: "/market",
  declined: "/declined",
} as const;
type LoginStatus = keyof typeof DESTINATION;

/** Clamp an untrusted status value to a known one. */
function asStatus(raw: string): LoginStatus {
  return raw in DESTINATION ? (raw as LoginStatus) : "registration";
}

/**
 * Step 2 — verify the submitted code. On success the login status decides where
 * the user goes: new users into KYC, approved users to the market, and declined
 * users to the review screen. The challenge id comes from the httpOnly cookie,
 * never the form/URL.
 */
export async function verifyLogin(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const challenge = await readLoginChallenge();
  if (!challenge) redirect("/login");

  const code = String(formData.get("code") ?? "");
  const result = await container
    .resolve(TOKENS.VerifyOtpUseCase)
    .execute(challenge.cid, code);

  if (!result.ok) {
    return { error: result.error.message };
  }

  const next = challenge.next;

  // Declined users never get a session and never see the gate — straight to
  // the review screen.
  if (result.data.status === "declined") {
    await clearLoginChallenge();
    redirect(DESTINATION.declined);
  }

  // Second step: users who set a two-step password must enter it before the
  // platform — the session starts AFTER the gate, so it cannot be skipped. The
  // resolved status is carried to the gate in an httpOnly cookie, not the URL.
  const profile = await container.resolve(TOKENS.GetProfileUseCase).execute();
  if (profile.ok && profile.data.twoFactorEnabled) {
    await setLoginStatus({ status: result.data.status, next });
    await clearLoginChallenge();
    redirect("/login/two-step");
  }

  await clearLoginChallenge();
  await startSession();
  redirect(next ?? DESTINATION[result.data.status]);
}

/**
 * Biometric variant of the gate: the device verified the user via WebAuthn
 * (client-side `navigator.credentials.get`). Mock: the assertion signature is
 * NOT re-verified here — that is backend work once auth sessions land; this
 * action only performs the redirect the password path would. Status + next come
 * from the httpOnly cookie set at the OTP step.
 */
export async function passTwoStepBiometric(): Promise<void> {
  const pending = await readLoginStatus();
  if (!pending) redirect("/login");

  const resolved = asStatus(pending.status);
  await clearLoginStatus();
  if (resolved !== "declined") await startSession();
  redirect(pending.next ?? DESTINATION[resolved]);
}

/**
 * Step 3 (only when a two-step password is set) — verify it, then continue to
 * the status destination read from the httpOnly cookie.
 */
export async function verifyTwoStepLogin(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const pending = await readLoginStatus();
  if (!pending) redirect("/login");

  const password = String(formData.get("password") ?? "");
  const result = await container
    .resolve(TOKENS.TwoStepPasswordUseCase)
    .verify(password);

  if (!result.ok) {
    return { error: result.error.message };
  }

  const resolved = asStatus(pending.status);
  await clearLoginStatus();
  if (resolved !== "declined") await startSession();
  redirect(pending.next ?? DESTINATION[resolved]);
}
