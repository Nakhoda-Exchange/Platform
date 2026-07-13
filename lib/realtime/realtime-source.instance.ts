import type { RealtimeSource } from "@/lib/core/application/realtime/ports/realtime-source.port";
import { MockRealtimeSource } from "@/lib/infrastructure/realtime/mock-realtime.source";
import { WsRealtimeSource } from "@/lib/infrastructure/realtime/ws-realtime.source";

/**
 * Client composition root for realtime. With `NEXT_PUBLIC_WS_URL` set the app
 * connects to the backend WebSocket; without it an in-browser simulator serves
 * — so realtime works standalone, mirroring the `API_BASE_URL` HTTP-vs-mock
 * switch for the request/response ports. A lazy singleton so every hook shares
 * one connection.
 */
let instance: RealtimeSource | null = null;

export function getRealtimeSource(): RealtimeSource {
  if (!instance) {
    const url = process.env.NEXT_PUBLIC_WS_URL;
    instance = url ? new WsRealtimeSource(url) : new MockRealtimeSource();
  }
  return instance;
}
