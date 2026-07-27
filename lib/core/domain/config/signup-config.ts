/**
 * Signup configuration, served by the backend. Public (no session) because the
 * login/KYC screens must know whether an invite code is required before the user
 * has an account.
 */
export interface SignupConfig {
  /**
   * When true, registration is closed to anyone without a valid invite code.
   * Existing users are unaffected — this gates signup, not login.
   */
  inviteOnly: boolean;
}
