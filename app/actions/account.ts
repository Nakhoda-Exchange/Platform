"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
