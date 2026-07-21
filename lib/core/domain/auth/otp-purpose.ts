/**
 * What an OTP challenge is issued for (backend issue #155). An OTP is
 * purpose-bound: a code issued for one flow can never satisfy another flow's
 * verification — e.g. a `login` code can't stand in for the `withdraw` second
 * factor. Mirrors the backend's `OtpPurpose`.
 *
 *   login    — start a session (auth OTP verify)
 *   withdraw — the money-out second factor (wallet withdrawal)
 *   reset    — re-confirm identity to reset the two-step password
 */
export type OtpPurpose = "login" | "withdraw" | "reset";
