"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import {
  KYC_PENDING_COOKIE,
  encodeIdentity,
  type KycFormState,
} from "./kyc-state";
import { REFERRAL_COOKIE } from "./referral-state";

/**
 * KYC step 1 — validate national code + Jalali birth date and run the identity
 * inquiry. The returned identity is carried to the confirm screen in an httpOnly
 * cookie (base64 JSON), so the name/father fields are never exposed or editable
 * via the URL and never readable by client JS. A cookie — not process memory —
 * because Vercel serves the submit and confirm requests from different
 * serverless instances, so an in-memory handoff would be lost between them.
 *
 * The invite code is optional and captured on the form; the mock inquiry does
 * not consume it yet — wire it through when the backend needs it.
 */
export async function submitIdentity(
  _prev: KycFormState,
  formData: FormData,
): Promise<KycFormState> {
  const nationalCode = String(formData.get("nationalCode") ?? "");
  const birthDate = String(formData.get("birthDate") ?? "");

  const result = await container
    .resolve(TOKENS.InquireIdentityUseCase)
    .execute(nationalCode, birthDate);

  if (!result.ok) {
    return { error: result.error.message };
  }

  (await cookies()).set(KYC_PENDING_COOKIE, encodeIdentity(result.data), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/kyc/confirm");
}

/**
 * KYC step 2 — the user confirmed the read-only identity. A real app would
 * persist verification here; the mock clears the pending record and proceeds.
 */
export async function confirmKyc(): Promise<void> {
  const store = await cookies();
  store.delete(KYC_PENDING_COOKIE);

  // Referral attribution finalizes here: KYC passed with a stored ?ref code.
  const ref = store.get(REFERRAL_COOKIE)?.value;
  if (ref) {
    await container.resolve(TOKENS.GetReferralOverviewUseCase).applyCode(ref);
    store.delete(REFERRAL_COOKIE);
  }

  redirect("/market");
}
