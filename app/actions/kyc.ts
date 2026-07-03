"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { KYC_PENDING_COOKIE, type KycFormState } from "./kyc-state";

/**
 * KYC step 1 — validate national code + Jalali birth date and run the identity
 * inquiry. The returned identity is stashed server-side under an opaque id; only
 * that id is sent to the client (httpOnly cookie), so the name/father fields are
 * never exposed or editable via the URL. Then move to the confirm screen.
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

  const pendingId = await container
    .resolve(TOKENS.KycSessionStore)
    .save(result.data);

  (await cookies()).set(KYC_PENDING_COOKIE, pendingId, {
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
  const pendingId = store.get(KYC_PENDING_COOKIE)?.value;
  if (pendingId) {
    await container.resolve(TOKENS.KycSessionStore).clear(pendingId);
    store.delete(KYC_PENDING_COOKIE);
  }
  redirect("/market");
}
