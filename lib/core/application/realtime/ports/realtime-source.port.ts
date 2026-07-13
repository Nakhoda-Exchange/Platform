import type {
  RealtimeChannel,
  RealtimeEvent,
} from "@/lib/core/domain/realtime/events";

/** Connection state of a realtime source, surfaced to the UI. */
export type ConnectionStatus = "connecting" | "open" | "closed";

export type RealtimeListener = (event: RealtimeEvent) => void;
export type StatusListener = (status: ConnectionStatus) => void;

/**
 * A live event source the presentation layer subscribes to. Two adapters
 * implement it: a WebSocket client (backed by the backend `/ws`) and an
 * in-browser mock simulator — chosen by configuration, exactly like the
 * HTTP-vs-mock switch for the request/response ports. Framework-free so the
 * React hook is a thin wrapper.
 */
export interface RealtimeSource {
  /**
   * Start receiving `channels` and invoke `onEvent` per frame. Connecting is
   * idempotent and lazy (first subscribe opens the transport). Returns an
   * unsubscribe function; the transport closes when the last listener leaves.
   */
  subscribe(channels: RealtimeChannel[], onEvent: RealtimeListener): () => void;

  /** Observe connection-status changes; returns an unsubscribe function. */
  onStatus(listener: StatusListener): () => void;

  /** Current connection status. */
  readonly status: ConnectionStatus;
}
