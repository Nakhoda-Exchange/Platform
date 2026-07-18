/**
 * The login session cookie (issue #78). Presence-based for now: an opaque
 * value with no server-side store — real validation lands with full auth
 * sessions; until then this gates the platform routes and proves the
 * cookie lifecycle (set only at true login success, cleared on logout).
 */
export const SESSION_COOKIE = "session";

/**
 * The backend auth token (from OTP verify). Kept in its own httpOnly cookie —
 * separate from the route-gate {@link SESSION_COOKIE} — because it must be
 * forwarded as the `Authorization: Bearer` on every backend call *before* the
 * gate is opened (e.g. the two-step gate calls authenticated endpoints while
 * the route session is deliberately not yet set). The HTTP request interceptor
 * reads this. In mock mode nothing checks it, so both modes set it uniformly.
 */
export const AUTH_TOKEN_COOKIE = "auth_token";

/** Only same-origin paths may be used as post-login destinations. */
export function safeNextPath(raw: string | undefined): string | null {
  if (!raw) return null;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}
