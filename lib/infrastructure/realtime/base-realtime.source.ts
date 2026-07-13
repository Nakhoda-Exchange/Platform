import type {
  ConnectionStatus,
  RealtimeListener,
  RealtimeSource,
  StatusListener,
} from "@/lib/core/application/realtime/ports/realtime-source.port";
import {
  channelOf,
  type RealtimeChannel,
  type RealtimeEvent,
} from "@/lib/core/domain/realtime/events";

interface Registration {
  channels: Set<RealtimeChannel>;
  onEvent: RealtimeListener;
}

/**
 * Shared bookkeeping for realtime adapters: the listener registry, the union of
 * active channels, channel-filtered dispatch, and status fan-out. Subclasses
 * implement only the transport via {@link open}/{@link close} (and optionally
 * {@link channelsChanged}). The transport opens on the first subscriber and
 * closes when the last one leaves, so nothing streams while no one is watching.
 */
export abstract class BaseRealtimeSource implements RealtimeSource {
  private readonly registrations = new Set<Registration>();
  private readonly statusListeners = new Set<StatusListener>();
  private currentStatus: ConnectionStatus = "closed";

  get status(): ConnectionStatus {
    return this.currentStatus;
  }

  subscribe(
    channels: RealtimeChannel[],
    onEvent: RealtimeListener,
  ): () => void {
    const registration: Registration = { channels: new Set(channels), onEvent };
    const isFirst = this.registrations.size === 0;
    this.registrations.add(registration);

    if (isFirst) this.open();
    else this.channelsChanged();

    return () => {
      if (!this.registrations.delete(registration)) return;
      if (this.registrations.size === 0) this.close();
      else this.channelsChanged();
    };
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /** The union of every subscriber's channels. */
  protected activeChannels(): RealtimeChannel[] {
    const channels = new Set<RealtimeChannel>();
    for (const reg of this.registrations) {
      for (const channel of reg.channels) channels.add(channel);
    }
    return [...channels];
  }

  /** Deliver an event to every listener subscribed to its channel. */
  protected dispatch(event: RealtimeEvent): void {
    const channel = channelOf(event);
    for (const reg of this.registrations) {
      if (reg.channels.has(channel)) reg.onEvent(event);
    }
  }

  protected setStatus(status: ConnectionStatus): void {
    if (this.currentStatus === status) return;
    this.currentStatus = status;
    for (const listener of this.statusListeners) listener(status);
  }

  /** Open the transport (first subscriber arrived). */
  protected abstract open(): void;
  /** Close the transport (last subscriber left). */
  protected abstract close(): void;
  /**
   * The set of active channels changed while connected (default: no-op).
   * Implementations read the new set from {@link activeChannels}.
   */
  protected channelsChanged(): void {}
}
