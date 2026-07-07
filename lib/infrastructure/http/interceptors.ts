import { cookies } from "next/headers";
import type { RequestInterceptor } from "./http-client";

// Matches app/actions/session-state.ts on the route-protection branch (#80);
// import from there once it merges.
const SESSION_COOKIE = "session";

/**
 * The main request interceptor: forwards the login session as a Bearer token
 * and pins the API locale to Persian. All HTTP adapters run server-side
 * (server components / actions), so the session cookie is readable here.
 */
export const authAndLocaleInterceptor: RequestInterceptor = async (request) => {
  request.headers["Accept-Language"] = "fa-IR";
  try {
    const session = (await cookies()).get(SESSION_COOKIE)?.value;
    if (session) request.headers.Authorization = `Bearer ${session}`;
  } catch {
    // Outside a request scope (build-time render) — no session to forward.
  }
};
