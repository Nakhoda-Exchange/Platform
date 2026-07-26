import type { LoginStatus } from "@/lib/core/domain/auth/login-status";

/**
 * The route-gate access claim (issue #68).
 *
 * The `session` cookie only proves a login happened; it says nothing about
 * whether the user cleared KYC. A user who has only passed OTP holds a full
 * session, so a presence-only gate lets them reach the money routes (/wallet,
 * /trade) — the exact defense-in-depth gap the audit flagged. This module mints
 * and verifies a small **signed** claim carrying the user's access level, which
 * the proxy reads to redirect not-yet-verified users to /kyc.
 *
 * It is HMAC-SHA256 signed with `SESSION_SIGNING_SECRET` (server-only) so it
 * cannot be forged from the client: `httpOnly` keeps JS out, and the signature
 * keeps a hand-crafted request out. Everything here is Web Crypto only, so it
 * runs unchanged in both the Node server actions (minting) and the edge proxy
 * (verifying).
 *
 * When the secret is unset (local dev / mock, which has no HTTPS and no real
 * backend) signing is disabled: minting yields `null` and verification returns
 * `"unsigned"`, and the proxy falls back to its presence-only behavior. Set the
 * secret in every real environment to arm the gate.
 */

/** Access level a session is granted. `verified` may use the whole platform. */
export type AccessLevel = "verified" | "pending_kyc";

/** Verification outcome: a level, `null` (missing/tampered), or signing-off. */
export type AccessClaim = AccessLevel | "unsigned";

/** Map the login status to the access level the gate enforces. */
export function accessLevelForStatus(status: LoginStatus): AccessLevel {
  return status === "approved" ? "verified" : "pending_kyc";
}

function secret(): string | undefined {
  return process.env.SESSION_SIGNING_SECRET || undefined;
}

const encoder = new TextEncoder();

async function hmac(payload: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(payload),
  );
  return base64url(new Uint8Array(sig));
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Constant-time string compare, so signatures don't leak via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Sign an access level into the cookie value `"<level>.<sig>"`. Returns `null`
 * when no secret is configured (signing disabled) so the caller can skip
 * setting the cookie in that mode.
 */
export async function signAccessClaim(
  level: AccessLevel,
): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const sig = await hmac(level, key);
  return `${level}.${sig}`;
}

/**
 * Verify a cookie value. Returns the level when the signature checks out,
 * `null` when it's missing or tampered, and `"unsigned"` when signing is
 * disabled (no secret) so the proxy can degrade to presence-only.
 */
export async function verifyAccessClaim(
  value: string | undefined,
): Promise<AccessClaim | null> {
  const key = secret();
  if (!key) return "unsigned";
  if (!value) return null;

  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const level = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (level !== "verified" && level !== "pending_kyc") return null;

  const expected = await hmac(level, key);
  return timingSafeEqual(sig, expected) ? (level as AccessLevel) : null;
}
