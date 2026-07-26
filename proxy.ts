import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_CLAIM_COOKIE,
  SESSION_COOKIE,
} from "@/app/actions/session-state";
import { verifyAccessClaim } from "@/lib/auth/access-claim";

/**
 * Route protection (issue #78): the authenticated platform lives behind the
 * session cookie. Presence-based until full auth sessions land (the cookie
 * is only ever set by real login success — after the two-step gate when one
 * is enabled — so this is the gate, not the proof of identity).
 *
 * KYC gate (issue #68): a session alone is not enough for the money routes. A
 * pre-KYC (OTP-only) user holds a full session, so on top of presence the gate
 * reads the *signed* access claim (`lib/auth/access-claim.ts`) and sends a
 * not-yet-verified user to /kyc before /wallet or /trade. The claim is signed
 * so it can't be forged from the client; when signing is disabled (no secret,
 * dev/mock) the gate degrades to presence-only. This is defense-in-depth — the
 * backend still KYC-gates every money endpoint authoritatively.
 */

/** Route prefixes that require a KYC-verified session, not merely a session. */
const KYC_GATED = ["/wallet", "/trade"];

function needsKyc(pathname: string): boolean {
  return KYC_GATED.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // Logged-in users don't need the login screen.
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/market", request.url));
  }

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  // Money routes additionally require a KYC-verified claim. A claim that
  // explicitly says `pending_kyc` (OTP-only user) is bounced to /kyc; a missing
  // or unsigned claim fails open (existing/legacy sessions, or signing disabled)
  // and is left to the authoritative backend gate.
  if (needsKyc(pathname)) {
    const claim = await verifyAccessClaim(
      request.cookies.get(ACCESS_CLAIM_COOKIE)?.value,
    );
    if (claim === "pending_kyc") {
      return NextResponse.redirect(new URL("/kyc", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // The (platform) group + /login (for the logged-in bounce).
  matcher: [
    "/market/:path*",
    "/market",
    "/wallet/:path*",
    "/wallet",
    "/account/:path*",
    "/account",
    "/trade/:path*",
    "/login",
  ],
};
