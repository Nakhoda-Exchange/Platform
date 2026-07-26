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
import { ACCESS_CLAIM_COOKIE } from "./session-state";
import { COOKIE_OPTIONS } from "@/lib/utils/cookie-options";
import { signAccessClaim } from "@/lib/auth/access-claim";

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

  (await cookies()).set(
    KYC_PENDING_COOKIE,
    encodeIdentity(result.data),
    COOKIE_OPTIONS,
  );

  redirect("/kyc/confirm");
}

/**
 * KYC step 2 — the user confirmed the read-only identity. Tell the backend to
 * mark the user KYC-verified (which unlocks the trade/wallet routes); only on
 * success do we clear the pending record, finalize referral, and proceed. On
 * failure the pending cookie is kept so the user can retry.
 */
export async function confirmKyc(): Promise<KycFormState> {
  const result = await container
    .resolve(TOKENS.InquireIdentityUseCase)
    .confirm();
  if (!result.ok) {
    return { error: result.error.message };
  }

  const store = await cookies();
  store.delete(KYC_PENDING_COOKIE);

  // Re-mint the route-gate claim as `verified` (issue #68): the user just
  // cleared KYC, so the proxy must let them into /wallet and /trade without a
  // re-login. `null` ⇒ signing disabled (no secret, dev/mock) — gate stays
  // presence-only there, same as startSession.
  const claim = await signAccessClaim("verified");
  if (claim) {
    store.set(ACCESS_CLAIM_COOKIE, claim, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // Referral attribution finalizes here: KYC passed with a stored ?ref code.
  const ref = store.get(REFERRAL_COOKIE)?.value;
  if (ref) {
    await container.resolve(TOKENS.GetReferralOverviewUseCase).applyCode(ref);
    store.delete(REFERRAL_COOKIE);
  }

  redirect("/market");
}
