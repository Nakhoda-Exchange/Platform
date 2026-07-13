import { describe, expect, test } from "bun:test";
import { WsRealtimeSource } from "@/lib/infrastructure/realtime/ws-realtime.source";
import type {
  PriceTick,
  RealtimeEvent,
} from "@/lib/core/domain/realtime/events";

type Handler = (event: unknown) => void;

/** A minimal stand-in for the browser WebSocket, drivable from the test. */
class FakeSocket {
  readyState = 0;
  readonly sent: string[] = [];
  private readonly listeners = new Map<string, Handler[]>();

  constructor(readonly url: string) {}

  addEventListener(type: string, cb: Handler): void {
    const list = this.listeners.get(type) ?? [];
    list.push(cb);
    this.listeners.set(type, list);
  }
  send(data: string): void {
    this.sent.push(data);
  }
  close(): void {
    this.readyState = 3;
    this.fire("close", {});
  }

  private fire(type: string, event: unknown): void {
    for (const cb of this.listeners.get(type) ?? []) cb(event);
  }
  open(): void {
    this.readyState = WebSocket.OPEN;
    this.fire("open", {});
  }
  message(data: unknown): void {
    this.fire("message", { data: JSON.stringify(data) });
  }
}

const price: PriceTick = {
  type: "price",
  coinId: "btc",
  symbol: "BTC",
  priceIrt: 3_900_000_000,
  priceUsd: 65_800,
  change24h: 1.2,
  at: 1,
};

function makeSource() {
  let socket: FakeSocket | undefined;
  const source = new WsRealtimeSource("ws://test/ws", (url) => {
    socket = new FakeSocket(url);
    return socket as unknown as WebSocket;
  });
  return { source, socket: () => socket! };
}

describe("WsRealtimeSource", () => {
  test("connects on first subscribe and sends the channels on open", () => {
    const { source, socket } = makeSource();
    source.subscribe(["prices"], () => {});
    expect(source.status).toBe("connecting");

    socket().open();
    expect(source.status).toBe("open");
    expect(socket().sent).toContain(
      JSON.stringify({ type: "subscribe", channels: ["prices"] }),
    );
  });

  test("dispatches data frames and ignores control frames", () => {
    const { source, socket } = makeSource();
    const received: RealtimeEvent[] = [];
    source.subscribe(["prices"], (e) => received.push(e));
    socket().open();

    socket().message({ type: "welcome", channels: ["prices"], at: 1 });
    socket().message(price);
    socket().message({ type: "pong", at: 2 });

    expect(received).toEqual([price]);
  });

  test("closes the socket when the last subscriber leaves", () => {
    const { source, socket } = makeSource();
    const off = source.subscribe(["prices"], () => {});
    socket().open();

    off();
    expect(socket().readyState).toBe(3);
    expect(source.status).toBe("closed");
  });
});
