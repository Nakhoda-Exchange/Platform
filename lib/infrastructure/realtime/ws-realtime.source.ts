import type { RealtimeChannel } from "@/lib/core/domain/realtime/events";
import { isRealtimeEvent } from "@/lib/core/domain/realtime/events";
import { BaseRealtimeSource } from "@/lib/infrastructure/realtime/base-realtime.source";

const PING_INTERVAL_MS = 25_000;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 10_000;

/** Opens a real browser WebSocket; injectable so tests can supply a fake. */
export type SocketFactory = (url: string) => WebSocket;

/**
 * Fetches a short-lived WS ticket to authenticate the socket (issue #65).
 * Returns `null` when the user has no session / no backend, in which case the
 * connection is treated as unauthenticated (public `prices` only).
 */
export type TicketProvider = () => Promise<string | null>;

/**
 * WebSocket realtime source backed by the backend `GET /ws`. Reconnects with
 * capped exponential backoff, (re)sends the active channels on every (re)open,
 * and keeps the connection alive with periodic pings. Frames that aren't valid
 * realtime data events (welcome/pong/subscribed/error control frames) are
 * ignored by the data dispatch. Contract: `doc/realtime/api.md`.
 *
 * Authentication (issue #65): the `trades` channel carries a specific user's
 * order lifecycle, so on every (re)open the source fetches a fresh short-lived
 * ticket (the `httpOnly` auth cookie is unreachable from client JS) and sends it
 * as the first `{ type: "auth", ticket }` frame, before subscribing. Until that
 * succeeds the connection is unauthenticated: `trade.update` frames are dropped
 * rather than surfaced, so a spoofed/on-path `ws://` peer can't fabricate
 * "order done" money confirmations. Public `price` frames flow regardless.
 */
export class WsRealtimeSource extends BaseRealtimeSource {
  private ws?: WebSocket;
  private pingTimer?: ReturnType<typeof setInterval>;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private attempts = 0;
  private wantConnected = false;
  /** True once a valid ticket was sent on the current connection. */
  private authenticated = false;

  constructor(
    private readonly url: string,
    private readonly socketFactory: SocketFactory = (u) => new WebSocket(u),
    private readonly ticketProvider?: TicketProvider,
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
      void this.authenticateAndSubscribe(ws);
      this.pingTimer = setInterval(
        () => this.send({ type: "ping" }),
        PING_INTERVAL_MS,
      );
    });
    ws.addEventListener("message", (event) => this.onMessage(event));
    ws.addEventListener("close", () => this.onClosed());
    ws.addEventListener("error", () => ws.close());
  }

  /**
   * Authenticate the freshly-opened socket, then subscribe. The ticket is
   * fetched per (re)connection because it's short-lived; the `auth` frame goes
   * out before `subscribe` so the server can authorize the `trades` channel.
   * Without a ticket the connection stays unauthenticated (public data only).
   */
  private async authenticateAndSubscribe(ws: WebSocket): Promise<void> {
    this.authenticated = false;
    if (this.ticketProvider) {
      try {
        const ticket = await this.ticketProvider();
        // Guard against a reconnect having replaced the socket mid-await.
        if (ticket && this.ws === ws) {
          this.send({ type: "auth", ticket });
          this.authenticated = true;
        }
      } catch {
        // Leave unauthenticated; trades stay suppressed, prices still flow.
      }
    }
    if (this.ws === ws) this.sendSubscribe(this.activeChannels());
  }

  private onMessage(event: MessageEvent): void {
    if (typeof event.data !== "string") return;
    let payload: unknown;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }
    if (!isRealtimeEvent(payload)) return;
    // Never surface per-user money events from an unauthenticated connection
    // (issue #65): a spoofed/on-path peer must not be able to fabricate order
    // confirmations. Public price ticks are unaffected.
    if (payload.type === "trade.update" && !this.authenticated) return;
    this.dispatch(payload);
  }

  private onClosed(): void {
    this.clearPing();
    this.ws = undefined;
    this.authenticated = false;
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
