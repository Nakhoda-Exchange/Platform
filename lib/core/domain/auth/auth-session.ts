import type { LoginStatus } from "./login-status";

/** A logged-in user session, plus where the app should route them next. */
export interface AuthSession {
  userId: string;
  mobile: string;
  token: string;
  status: LoginStatus;
}
