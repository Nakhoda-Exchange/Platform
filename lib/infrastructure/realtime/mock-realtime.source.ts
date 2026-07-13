import { BaseRealtimeSource } from "@/lib/infrastructure/realtime/base-realtime.source";
import { MarketSimulator } from "@/lib/infrastructure/realtime/market-simulator";

const PRICE_INTERVAL_MS = 2000;
const TRADE_INTERVAL_MS = 4000;

/**
 * In-browser realtime source: no server, just a {@link MarketSimulator} on
 * timers. Selected when `NEXT_PUBLIC_WS_URL` is unset so the platform streams
 * live-looking prices and trade updates standalone — the realtime twin of the
 * in-memory mock repositories.
 */
export class MockRealtimeSource extends BaseRealtimeSource {
  private readonly sim = new MarketSimulator();
  private priceTimer?: ReturnType<typeof setInterval>;
  private tradeTimer?: ReturnType<typeof setInterval>;
  private openTimer?: ReturnType<typeof setTimeout>;

  protected open(): void {
    this.setStatus("connecting");
    // Defer "open" a tick so subscribers see the connecting→open transition,
    // matching a real socket's async handshake.
    this.openTimer = setTimeout(() => {
      this.setStatus("open");
      for (const tick of this.sim.snapshot(Date.now())) this.dispatch(tick);
    }, 0);

    this.priceTimer = setInterval(() => {
      for (const tick of this.sim.advancePrices(Date.now()))
        this.dispatch(tick);
    }, PRICE_INTERVAL_MS);

    this.tradeTimer = setInterval(() => {
      for (const event of this.sim.advanceTrades(Date.now()))
        this.dispatch(event);
    }, TRADE_INTERVAL_MS);
  }

  protected close(): void {
    if (this.openTimer) clearTimeout(this.openTimer);
    if (this.priceTimer) clearInterval(this.priceTimer);
    if (this.tradeTimer) clearInterval(this.tradeTimer);
    this.openTimer = this.priceTimer = this.tradeTimer = undefined;
    this.setStatus("closed");
  }
}
