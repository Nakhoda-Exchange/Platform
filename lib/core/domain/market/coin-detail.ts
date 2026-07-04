import type { Coin } from "./coin";

/** Chart ranges offered on the coin detail page, shortest → longest. */
export type ChartRange = "24h" | "7d" | "1m" | "1y";
export const CHART_RANGES: readonly ChartRange[] = ["24h", "7d", "1m", "1y"];

/** A coin plus the extra data the detail page (PDP) needs: chart + stats + about. */
export interface CoinDetail {
  coin: Coin;
  high24h: number; // 24h high price, Toman
  low24h: number; // 24h low price, Toman
  volume24h: number; // 24h traded volume, همت
  description: string; // short Persian «about» blurb
  series: Record<ChartRange, number[]>; // mock price points per range (oldest → newest)
}
