import { describe, expect, test } from "bun:test";
import { BaseRealtimeSource } from "@/lib/infrastructure/realtime/base-realtime.source";
import type {
  PriceTick,
  RealtimeChannel,
  TradeUpdate,
} from "@/lib/core/domain/realtime/events";

class TestSource extends BaseRealtimeSource {
  opens = 0;
  closes = 0;
  lastChannels: RealtimeChannel[] = [];

  protected open(): void {
    this.opens++;
    this.setStatus("open");
  }
  protected close(): void {
    this.closes++;
    this.setStatus("closed");
  }
  protected override channelsChanged(): void {
    this.lastChannels = this.activeChannels();
  }

  // Expose protected members for the test.
  emit(event: PriceTick | TradeUpdate): void {
    this.dispatch(event);
  }
}

const price: PriceTick = {
  type: "price",
  coinId: "btc",
  symbol: "BTC",
  priceIrt: 1,
  priceUsd: 1,
  change24h: 0,
  at: 0,
};
const trade: TradeUpdate = {
  type: "trade.update",
  tradeId: "t1",
  coinId: "btc",
  symbol: "BTC",
  side: "buy",
  status: "open",
  amountCoin: 1,
  priceIrt: 1,
  totalIrt: 1,
  at: 0,
};

describe("BaseRealtimeSource", () => {
  test("opens on first subscribe and closes when the last leaves", () => {
    const source = new TestSource();
    expect(source.status).toBe("closed");

    const off1 = source.subscribe(["prices"], () => {});
    const off2 = source.subscribe(["trades"], () => {});
    expect(source.opens).toBe(1); // only the first opens
    expect(source.status).toBe("open");

    off1();
    expect(source.closes).toBe(0); // still one listener
    off2();
    expect(source.closes).toBe(1);
    expect(source.status).toBe("closed");
  });

  test("delivers events only to listeners on the matching channel", () => {
    const source = new TestSource();
    const priceEvents: string[] = [];
    const tradeEvents: string[] = [];
    source.subscribe(["prices"], (e) => priceEvents.push(e.type));
    source.subscribe(["trades"], (e) => tradeEvents.push(e.type));

    source.emit(price);
    source.emit(trade);

    expect(priceEvents).toEqual(["price"]);
    expect(tradeEvents).toEqual(["trade.update"]);
  });

  test("reports the union of active channels on change", () => {
    const source = new TestSource();
    source.subscribe(["prices"], () => {});
    const off = source.subscribe(["prices", "trades"], () => {});
    expect(new Set(source.lastChannels)).toEqual(new Set(["prices", "trades"]));

    off();
    expect(source.lastChannels).toEqual(["prices"]);
  });

  test("notifies status listeners and can be unsubscribed", () => {
    const source = new TestSource();
    const seen: string[] = [];
    const off = source.onStatus((s) => seen.push(s));

    source.subscribe(["prices"], () => {})();
    expect(seen).toEqual(["open", "closed"]);

    off();
    source.subscribe(["prices"], () => {});
    expect(seen).toEqual(["open", "closed"]); // no further notifications
  });
});
