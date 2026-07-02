/** An in-flight OTP verification challenge. */
export interface OtpChallenge {
  /** Opaque id the client returns when verifying (never encodes the mobile). */
  challengeId: string;
  mobile: string;
  /** Seconds the client should wait before offering to resend. */
  resendAfterSeconds: number;
}
