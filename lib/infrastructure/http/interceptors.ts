import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/app/actions/session-state";
import type { RequestInterceptor } from "./http-client";

/**
 * The main request interceptor: forwards the backend auth token as a Bearer
 * token and pins the API locale to Persian. All HTTP adapters run server-side
 * (server components / actions), so the token cookie is readable here. The
 * token is the value the backend issued at OTP verify (see auth actions) — not
 * the route-gate `session` cookie, which is opaque and backend-unknown.
 */
export const authAndLocaleInterceptor: RequestInterceptor = async (request) => {
  request.headers["Accept-Language"] = "fa-IR";
  try {
    const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
    if (token) request.headers.Authorization = `Bearer ${token}`;
  } catch {
    // Outside a request scope (build-time render) — no token to forward.
  }
};
