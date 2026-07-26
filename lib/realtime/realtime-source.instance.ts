import type { RealtimeSource } from "@/lib/core/application/realtime/ports/realtime-source.port";
import { WsRealtimeSource } from "@/lib/infrastructure/realtime/ws-realtime.source";
import { mintWsTicket } from "@/lib/realtime/ws-ticket.action";

/**
 * Client composition root for realtime. Connects to the backend WebSocket at
 * `NEXT_PUBLIC_WS_URL` — there is no in-browser simulator fallback. A lazy
 * singleton so every hook shares one connection.
 *
 * Security (issue #65): in production the URL MUST be `wss://` — a plain `ws://`
 * carries the auth ticket and per-user trade data in the clear and is open to
 * on-path frame injection. The socket authenticates via a short-lived ticket
 * minted server-side by {@link mintWsTicket} (the `httpOnly` auth cookie is
 * unreachable from client JS).
 */
let instance: RealtimeSource | null = null;

export function getRealtimeSource(): RealtimeSource {
  if (!instance) {
    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) {
      throw new Error(
        "NEXT_PUBLIC_WS_URL is required — the Platform has no realtime simulator fallback.",
      );
    }
    if (process.env.NODE_ENV === "production" && !url.startsWith("wss://")) {
      throw new Error(
        "NEXT_PUBLIC_WS_URL must use wss:// in production (issue #65): a plain ws:// exposes the auth ticket and user trade data to on-path attackers.",
      );
    }
    instance = new WsRealtimeSource(url, undefined, async () => {
      const minted = await mintWsTicket();
      return minted?.ticket ?? null;
    });
  }
  return instance;
}
