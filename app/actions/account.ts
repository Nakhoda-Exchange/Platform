"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { KYC_PENDING_COOKIE } from "./kyc-state";
import type { TwoStepFormState } from "./account-state";

/**
 * Ends the session and returns to the landing page. There is no persisted
 * auth session yet (the login mock only redirects), so this clears what state
 * exists (the pending-KYC cookie); wire real session teardown when auth lands.
 */
export async function logout(): Promise<void> {
  (await cookies()).delete(KYC_PENDING_COOKIE);
  redirect("/");
}

/** Set the two-step password (strength + retype match checked in the use case). */
export async function setTwoStepPassword(
  _prev: TwoStepFormState,
  formData: FormData,
): Promise<TwoStepFormState> {
  const result = await container
    .resolve(TOKENS.TwoStepPasswordUseCase)
    .set(
      String(formData.get("password") ?? ""),
      String(formData.get("confirm") ?? ""),
    );
  if (!result.ok) {
    return {
      status: "error",
      message: result.error.message,
      code: result.error.code,
    };
  }
  return { status: "success" };
}

/**
 * Reset a forgotten two-step password: national code + birth date must match
 * and an SMS code (mock 123456) confirms it, then the new password is set.
 */
export async function resetTwoStepPassword(
  _prev: TwoStepFormState,
  formData: FormData,
): Promise<TwoStepFormState> {
  const result = await container
    .resolve(TOKENS.TwoStepPasswordUseCase)
    .reset(
      String(formData.get("nationalCode") ?? ""),
      String(formData.get("birthDate") ?? ""),
      String(formData.get("code") ?? ""),
      String(formData.get("password") ?? ""),
      String(formData.get("confirm") ?? ""),
    );
  if (!result.ok) {
    return {
      status: "error",
      message: result.error.message,
      code: result.error.code,
    };
  }
  return { status: "success" };
}
