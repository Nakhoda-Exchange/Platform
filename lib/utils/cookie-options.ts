/**
 * `Secure` — the browser only sends the cookie over HTTPS.
 *
 * Every cookie this app sets is security-bearing: the backend bearer token
 * (`auth_token`), the session presence cookie, the KYC identity stash, and the
 * login-flow challenge. Without `Secure`, any one of them is capturable by a
 * network attacker on the first cleartext request — and `auth_token` IS the
 * user's credential, so capturing it is full account takeover.
 *
 * Conditional on production because dev runs on plain `http://localhost`, where
 * a `Secure` cookie is silently dropped by the browser and every flow that
 * depends on one breaks in a way that looks like a logic bug.
 */
const SECURE = process.env.NODE_ENV === "production";

/**
 * The baseline flags for every cookie we set. `httpOnly` keeps it out of
 * `document.cookie` (so stored XSS cannot read it), `sameSite: lax` blocks the
 * cross-site request forgery shape while still surviving a top-level navigation
 * back into the app, and `path: "/"` scopes it to the whole app.
 *
 * Spread it and add `maxAge`:
 *
 *     cookies().set(NAME, value, { ...COOKIE_OPTIONS, maxAge: SOME_TTL });
 *
 * Use this rather than hand-writing the flags at each call site — the flags
 * drifting apart across sites is exactly how one cookie ends up missing
 * `Secure` (issue #66).
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: SECURE,
  sameSite: "lax",
  path: "/",
} as const;
