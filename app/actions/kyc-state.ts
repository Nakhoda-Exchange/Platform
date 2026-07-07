// Plain module (no "use server") — server-action files may only export async
// functions, so shared KYC constants + form-state types live here.

import type { Identity } from "@/lib/core/domain/kyc/identity";

export interface KycFormState {
  error: string | null;
}

export const initialKycFormState: KycFormState = { error: null };

/**
 * httpOnly cookie carrying the base64-JSON identity between the KYC submit and
 * confirm steps. httpOnly so client JS can't read it and it never touches the
 * URL; base64 so unicode (Persian) names are cookie-safe.
 */
export const KYC_PENDING_COOKIE = "kyc_pending";

export function encodeIdentity(identity: Identity): string {
  return Buffer.from(JSON.stringify(identity)).toString("base64");
}

export function decodeIdentity(value: string): Identity | null {
  try {
    return JSON.parse(Buffer.from(value, "base64").toString());
  } catch {
    return null;
  }
}
