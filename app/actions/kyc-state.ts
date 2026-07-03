// Plain module (no "use server") — server-action files may only export async
// functions, so shared KYC constants + form-state types live here.

export interface KycFormState {
  error: string | null;
}

export const initialKycFormState: KycFormState = { error: null };

/** httpOnly cookie holding only the opaque pending-KYC id — never the identity. */
export const KYC_PENDING_COOKIE = "kyc_pending";
