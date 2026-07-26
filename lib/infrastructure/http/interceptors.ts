import { cookies, headers } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/app/actions/session-state";
import type { RequestInterceptor } from "./http-client";

/**
 * Headers the real client IP may arrive in, most trustworthy first.
 *
 * `ar-real-ip` is set by the ArvanCloud edge and OVERWRITTEN there, so a client
 * cannot forge it — unlike `x-forwarded-for`, which is a client-settable list
 * that proxies append to. Prefer the CDN's own header and treat XFF as the
 * fallback for a direct-to-Caddy request (no CDN in front).
 */
const CLIENT_IP_HEADERS = [
  "ar-real-ip",
  "x-real-ip",
  "x-forwarded-for",
] as const;

/** First hop of a possibly-comma-separated header value. */
function firstHop(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

/**
 * The main request interceptor: forwards the backend auth token as a Bearer
 * token, pins the API locale to Persian, and PROPAGATES THE REAL CLIENT IP.
 * All HTTP adapters run server-side (server components / actions), so the
 * token cookie and the inbound request headers are both readable here. The
 * token is the value the backend issued at OTP verify (see auth actions) — not
 * the route-gate `session` cookie, which is opaque and backend-unknown.
 *
 * WHY THE IP HAS TO BE FORWARDED BY HAND: a server action calling the backend
 * opens a BRAND NEW request from this container to `substructure:4000`. None of
 * the inbound proxy headers come along, so without this the backend's
 * `clientIp()` finds no `x-forwarded-for`, falls back to the socket peer, and
 * records THIS CONTAINER's docker-bridge address (172.18.x) for every user —
 * which poisons `login_events.ip`, `sessions.ip` and collapses every visitor
 * into one rate-limit bucket.
 */
export const authAndLocaleInterceptor: RequestInterceptor = async (request) => {
  request.headers["Accept-Language"] = "fa-IR";
  try {
    const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
    if (token) request.headers.Authorization = `Bearer ${token}`;
  } catch {
    // Outside a request scope (build-time render) — no token to forward.
  }
  try {
    const inbound = await headers();
    for (const name of CLIENT_IP_HEADERS) {
      const ip = firstHop(inbound.get(name));
      if (ip) {
        // Send both: XFF is what the backend reads today, ar-real-ip is the
        // header it prefers. Setting the value (not appending) keeps the
        // backend's "first hop is the client" contract true.
        request.headers["X-Forwarded-For"] = ip;
        request.headers["Ar-Real-Ip"] = ip;
        break;
      }
    }
  } catch {
    // Outside a request scope (build-time render) — no inbound IP to forward.
  }
};
