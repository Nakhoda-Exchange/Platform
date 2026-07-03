/**
 * Where a user stands after logging in — decides where the app sends them:
 * - `registration`: new/unverified → must complete KYC
 * - `approved`: verified → may use the platform (market)
 * - `declined`: rejected → never sees the platform; may only retry KYC
 */
export type LoginStatus = "registration" | "approved" | "declined";
