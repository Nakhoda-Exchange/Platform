import type {
  PriceTick,
  TradeStatus,
  TradeUpdate,
} from "@/lib/core/domain/realtime/events";

interface SeedCoin {
  id: string;
  symbol: string;
  priceIrt: number;
  priceUsd: number;
}

const SEED: readonly SeedCoin[] = [
  { id: "btc", symbol: "BTC", priceIrt: 3_900_000_000, priceUsd: 65_800 },
  { id: "eth", symbol: "ETH", priceIrt: 210_000_000, priceUsd: 3_540 },
  { id: "usdt", symbol: "USDT", priceIrt: 59_300, priceUsd: 1 },
  { id: "sol", symbol: "SOL", priceIrt: 9_800_000, priceUsd: 165 },
  { id: "ton", symbol: "TON", priceIrt: 380_000, priceUsd: 6.4 },
];

interface CoinState extends SeedCoin {
  price: number;
  base: number;
}

interface SimTrade {
  tradeId: string;
  coin: SeedCoin;
  side: "buy" | "sell";
  amountCoin: number;
  priceIrt: number;
  totalIrt: number;
  status: TradeStatus;
  expiresAt: number;
}

/**
 * Browser-side market simulator powering the mock realtime source. It mirrors
 * the backend's synthetic feed (`Substructure src/modules/realtime`) so the app
 * streams live-looking prices and trade lifecycle events with no server.
 * Deterministic given a fixed `rng`, which the tests rely on; `now` is injected
 * so no wall clock is read here.
 */
export class MarketSimulator {
  private readonly coins: CoinState[];
  private readonly inflight = new Map<string, SimTrade>();
  private seq = 0;

  constructor(
    private readonly rng: () => number = Math.random,
    private readonly tradeTtlMs = 30_000,
  ) {
    this.coins = SEED.map((c) => ({
      ...c,
      price: c.priceIrt,
      base: c.priceIrt,
    }));
  }

  /** Current price of every coin — the snapshot sent right after connect. */
  snapshot(now: number): PriceTick[] {
    return this.coins.map((c) => this.toTick(c, now));
  }

  /** Nudge each price by a bounded random walk and return the ticks. */
  advancePrices(now: number): PriceTick[] {
    for (const c of this.coins) {
      const drift = (this.rng() * 2 - 1) * 0.004;
      const next = c.price * (1 + drift);
      c.price = Math.min(c.base * 1.08, Math.max(c.base * 0.92, next));
    }
    return this.snapshot(now);
  }

  /** Advance simulated order flow one step and return the trade updates. */
  advanceTrades(now: number): TradeUpdate[] {
    const events: TradeUpdate[] = [];

    for (const trade of [...this.inflight.values()]) {
      if (
        now >= trade.expiresAt &&
        (trade.status === "pending" || trade.status === "open")
      ) {
        trade.status = "expired";
        this.inflight.delete(trade.tradeId);
        events.push(this.toTradeEvent(trade, now));
        continue;
      }
      if (trade.status === "pending") {
        trade.status = "open";
        events.push(this.toTradeEvent(trade, now));
      } else if (trade.status === "open" && this.rng() < 0.5) {
        trade.status = "done";
        this.inflight.delete(trade.tradeId);
        events.push(this.toTradeEvent(trade, now));
      }
    }

    if (this.inflight.size < 4 && this.rng() < 0.6) {
      events.push(this.openTrade(now));
    }

    return events;
  }

  private openTrade(now: number): TradeUpdate {
    const coin = SEED[Math.floor(this.rng() * SEED.length) % SEED.length]!;
    const side: "buy" | "sell" = this.rng() < 0.5 ? "buy" : "sell";
    const amountCoin = Number((this.rng() * 2 + 0.01).toFixed(4));
    const trade: SimTrade = {
      tradeId: `sim-${++this.seq}`,
      coin,
      side,
      amountCoin,
      priceIrt: coin.priceIrt,
      totalIrt: Math.round(amountCoin * coin.priceIrt),
      status: "pending",
      expiresAt: now + this.tradeTtlMs,
    };
    this.inflight.set(trade.tradeId, trade);
    return this.toTradeEvent(trade, now);
  }

  private toTick(c: CoinState, now: number): PriceTick {
    const priceIrt = Math.round(c.price);
    const ratio = priceIrt / c.priceIrt;
    return {
      type: "price",
      coinId: c.id,
      symbol: c.symbol,
      priceIrt,
      priceUsd: Number((c.priceUsd * ratio).toFixed(2)),
      change24h: Number(((c.price / c.base - 1) * 100).toFixed(2)),
      at: now,
    };
  }

  private toTradeEvent(trade: SimTrade, now: number): TradeUpdate {
    const live = trade.status === "pending" || trade.status === "open";
    return {
      type: "trade.update",
      tradeId: trade.tradeId,
      coinId: trade.coin.id,
      symbol: trade.coin.symbol,
      side: trade.side,
      status: trade.status,
      amountCoin: trade.amountCoin,
      priceIrt: trade.priceIrt,
      totalIrt: trade.totalIrt,
      expiresAt: live ? trade.expiresAt : undefined,
      at: now,
    };
  }
}
