/** The signed-in user's profile as the account hub shows it. */
export interface UserProfile {
  name: string; // display name (from KYC identity)
  mobile: string; // login phone, e.g. 09111111111
  kycVerified: boolean; // false → show the «تکمیل احراز هویت» CTA
  twoFactorEnabled: boolean;
}
