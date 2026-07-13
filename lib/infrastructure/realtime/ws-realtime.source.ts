import type { RealtimeChannel } from "@/lib/core/domain/realtime/events";
import { isRealtimeEvent } from "@/lib/core/domain/realtime/events";
import { BaseRealtimeSource } from "@/lib/infrastructure/realtime/base-realtime.source";

const PING_INTERVAL_MS = 25_000;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 10_000;

/** Opens a real browser WebSocket; injectable so tests can supply a fake. */
export type SocketFactory = (url: string) => WebSocket;

/**
 * WebSocket realtime source backed by the backend `GET /ws`. Reconnects with
 * capped exponential backoff, (re)sends the active channels on every (re)open,
 * and keeps the connection alive with periodic pings. Frames that aren't valid
 * realtime data events (welcome/pong/subscribed/error control frames) are
 * ignored by the data dispatch. Contract: `doc/realtime/api.md`.
 */
export class WsRealtimeSource extends BaseRealtimeSource {
  private ws?: WebSocket;
  private pingTimer?: ReturnType<typeof setInterval>;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private attempts = 0;
  private wantConnected = false;

  constructor(
    private readonly url: string,
    private readonly socketFactory: SocketFactory = (u) => new WebSocket(u),
  ) {
    super();
  }

  protected open(): void {
    this.wantConnected = true;
    this.connect();
  }

  protected close(): void {
    this.wantConnected = false;
    this.clearTimers();
    this.ws?.close();
    this.ws = undefined;
    this.setStatus("closed");
  }

  protected override channelsChanged(): void {
    this.sendSubscribe(this.activeChannels());
  }

  private connect(): void {
    this.setStatus("connecting");
    const ws = this.socketFactory(this.url);
    this.ws = ws;

    ws.addEventListener("open", () => {
      this.attempts = 0;
      this.setStatus("open");
      this.sendSubscribe(this.activeChannels());
      this.pingTimer = setInterval(
        () => this.send({ type: "ping" }),
        PING_INTERVAL_MS,
      );
    });
    ws.addEventListener("message", (event) => this.onMessage(event));
    ws.addEventListener("close", () => this.onClosed());
    ws.addEventListener("error", () => ws.close());
  }

  private onMessage(event: MessageEvent): void {
    if (typeof event.data !== "string") return;
    let payload: unknown;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }
    if (isRealtimeEvent(payload)) this.dispatch(payload);
  }

  private onClosed(): void {
    this.clearPing();
    this.ws = undefined;
    if (!this.wantConnected) return;

    this.setStatus("connecting");
    const delay = Math.min(
      MAX_BACKOFF_MS,
      BASE_BACKOFF_MS * 2 ** this.attempts,
    );
    this.attempts += 1;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private sendSubscribe(channels: RealtimeChannel[]): void {
    if (channels.length > 0) this.send({ type: "subscribe", channels });
  }

  private send(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private clearPing(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = undefined;
  }

  private clearTimers(): void {
    this.clearPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }
}
