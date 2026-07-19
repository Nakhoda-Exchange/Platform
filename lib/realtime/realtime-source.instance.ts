import type { RealtimeSource } from "@/lib/core/application/realtime/ports/realtime-source.port";
import { WsRealtimeSource } from "@/lib/infrastructure/realtime/ws-realtime.source";

/**
 * Client composition root for realtime. Connects to the backend WebSocket at
 * `NEXT_PUBLIC_WS_URL` — there is no in-browser simulator fallback. A lazy
 * singleton so every hook shares one connection.
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
    instance = new WsRealtimeSource(url);
  }
  return instance;
}
