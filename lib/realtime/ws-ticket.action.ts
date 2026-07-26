"use server";

import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/app/actions/session-state";

/**
 * Mint a short-lived WebSocket ticket (issue #65).
 *
 * The realtime `trades` channel streams a specific user's order lifecycle, so
 * the socket must be authenticated. The browser can't attach the credential
 * itself: the backend token lives in an `httpOnly` cookie unreachable from
 * client JS. So this server action (a BFF hop) reads that cookie server-side and
 * asks the backend to mint a single-use, short-lived ticket the client then
 * attaches to the socket. The ticket — not the long-lived token — is what
 * travels over the WS handshake.
 *
 * Returns `null` when there's no session or no backend configured (dev/mock),
 * so the client stays connected for the public `prices` channel but is treated
 * as unauthenticated for `trades`.
 *
 * Backend contract (Substructure — see doc/realtime/api.md):
 *   POST {API_BASE_URL}/realtime/ticket   Authorization: Bearer <token>
 *   200 → { "ticket": "<opaque>", "expiresInSeconds": 30 }
 * The ticket must be short-lived, single-use, and scoped to the token's user;
 * `GET /ws` validates it on the upgrade (with an Origin check) and only then
 * streams that user's `trades`.
 */
export async function mintWsTicket(): Promise<{ ticket: string } | null> {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  const baseUrl = process.env.API_BASE_URL;
  if (!token || !baseUrl) return null;

  try {
    const res = await fetch(`${baseUrl}/realtime/ticket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { ticket?: unknown };
    return typeof body.ticket === "string" ? { ticket: body.ticket } : null;
  } catch {
    return null;
  }
}
