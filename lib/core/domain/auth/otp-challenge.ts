/** An in-flight OTP verification challenge. */
export interface OtpChallenge {
  /** Opaque id the client returns when verifying (never encodes the mobile). */
  challengeId: string;
  mobile: string;
  /** Seconds the client should wait before offering to resend. */
  resendAfterSeconds: number;
}

/**
 * Operation parameters an OTP challenge is bound to server-side (backend issue
 * #154), so a code issued for one operation can never authorize a different one
 * — e.g. a withdraw code is bound to its exact `{ amountIrt, ibanId }`, so a
 * code obtained for one withdrawal can't approve a different amount/destination
 * inside the validity window. Sent with the request; the backend stores it on
 * the challenge and re-checks it at verify time. Values are primitives so the
 * auth layer stays agnostic of any one flow's parameter names.
 */
export interface OtpBinding {
  readonly [param: string]: string | number;
}
