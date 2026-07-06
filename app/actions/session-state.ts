/**
 * The login session cookie (issue #78). Presence-based for now: an opaque
 * value with no server-side store — real validation lands with full auth
 * sessions; until then this gates the platform routes and proves the
 * cookie lifecycle (set only at true login success, cleared on logout).
 */
export const SESSION_COOKIE = "session";

/** Only same-origin paths may be used as post-login destinations. */
export function safeNextPath(raw: string | undefined): string | null {
  if (!raw) return null;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}
