import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/app/actions/session-state";

/**
 * Route protection (issue #78): the authenticated platform lives behind the
 * session cookie. Presence-based until full auth sessions land (the cookie
 * is only ever set by real login success — after the two-step gate when one
 * is enabled — so this is the gate, not the proof of identity).
 */
export function proxy(request: NextRequest) {
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
