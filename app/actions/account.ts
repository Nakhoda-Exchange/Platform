"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { KYC_PENDING_COOKIE } from "./kyc-state";

/**
 * Ends the session and returns to the landing page. There is no persisted
 * auth session yet (the login mock only redirects), so this clears what state
 * exists (the pending-KYC cookie); wire real session teardown when auth lands.
 */
export async function logout(): Promise<void> {
  (await cookies()).delete(KYC_PENDING_COOKIE);
  redirect("/");
}

/**
 * Enable/disable two-step verification after checking the SMS code
 * (mock code: 123456). Verification lives in the use case.
 */
export async function setTwoFactor(
  _prev: { status: "idle" | "success" } | { status: "error"; message: string },
  formData: FormData,
): Promise<
  { status: "idle" | "success" } | { status: "error"; message: string }
> {
  const code = String(formData.get("code") ?? "");
  const enable = formData.get("enable") === "1";
  const result = await container
    .resolve(TOKENS.SetTwoFactorUseCase)
    .execute(code, enable);
  if (!result.ok) return { status: "error", message: result.error.message };
  return { status: "success" };
}
