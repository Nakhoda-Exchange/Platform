import type { Coin } from "./coin";

/** Chart ranges offered on the coin detail page, shortest → longest. */
export type ChartRange = "24h" | "7d" | "1m" | "1y";
export const CHART_RANGES: readonly ChartRange[] = ["24h", "7d", "1m", "1y"];

/**
 * One priced moment on the PDP chart. `at` is epoch ms — deliberately not a
 * Date, so the payload crosses server → client props untouched.
 */
export interface PricePoint {
  at: number; // epoch ms
  priceIrt: number; // Toman
}

/** One OHLC candle for the PDP candlestick view. `at` is epoch ms. */
export interface Candle {
  at: number; // epoch ms (bucket open time)
  open: number;
  high: number;
  low: number;
  close: number; // Toman
}

/** A short article about a coin, shown on the PDP «مطالب مرتبط» list. */
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string; // one-line teaser
  source: string; // where it's from, e.g. «بلاگ ناخدا»
  publishedAt: number; // epoch ms
}

/** A coin plus the extra data the detail page (PDP) needs: chart + stats + about. */
export interface CoinDetail {
  coin: Coin;
  // 24h high/low are decimal STRINGS and NULLABLE: `null` means unavailable —
  // hide the stat or show «—», never 0/stale. Parse with `parsePrice` to format.
  high24h: string | null; // 24h high price, Toman (decimal string; null = unavailable)
  low24h: string | null; // 24h low price, Toman (decimal string; null = unavailable)
  volume24h: number; // 24h traded volume, همت
  description: string; // short Persian «about» blurb
  // Chart data per range (oldest → newest). Optional: newly-discovered/thin
  // coins arrive without price history, so the market feed omits these. The
  // PDP renders a graceful «no chart yet» state when they are absent rather
  // than assuming a curated coin's full shape.
  series?: Record<ChartRange, PricePoint[]>; // price points per range
  candles?: Record<ChartRange, Candle[]>; // OHLC buckets per range
  // On-chain holder count (best-effort). Null/absent when no indexer source
  // covers the coin — the PDP hides the holders row rather than showing 0 or a
  // fabricated number. Never treat as "0 holders".
  holdersCount?: number | null;
  // Optional editorial extras — the backend market feed does not carry these
  // yet, so they are present only where a richer source (or the mock) supplies
  // them. The PDP renders each only when set.
  holders?: number; // how many people hold this coin on the platform
  history?: string; // longer Persian background / history
  blogPosts?: BlogPost[]; // related articles
}

/** One range's chart payload from GET /market/coins/{id}/chart?timeframe=. */
export interface CoinChart {
  series: PricePoint[]; // line points, oldest → newest (empty when none for the range)
  candles: Candle[]; // OHLC buckets, oldest → newest (empty when none for the range)
}
