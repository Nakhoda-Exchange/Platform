"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { KYC_PENDING_COOKIE } from "./kyc-state";
import { AUTH_TOKEN_COOKIE, SESSION_COOKIE } from "./session-state";
import type { TwoStepFormState } from "./account-state";

/**
 * Ends the session and returns to the landing page. There is no persisted
 * auth session yet (the login mock only redirects), so this clears what state
 * exists (the pending-KYC cookie); wire real session teardown when auth lands.
 */
export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(KYC_PENDING_COOKIE);
  store.delete(SESSION_COOKIE);
  store.delete(AUTH_TOKEN_COOKIE);
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

/** Announcements as serializable DTOs (Dates → ISO) for the client cache. */
export async function fetchAnnouncements(): Promise<
  import("@/lib/utils/announcements-db").AnnouncementDto[]
> {
  const result = await container
    .resolve(TOKENS.ListAnnouncementsUseCase)
    .execute();
  if (!result.ok) return [];
  return result.data.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    at: a.at.toISOString(),
    image: a.image,
    action: a.action,
  }));
}
