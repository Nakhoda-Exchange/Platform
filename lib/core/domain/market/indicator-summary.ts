import type { ChartRange, PricePoint } from "./coin-detail";

export type IndicatorVerdict = "buy" | "hold" | "sell";

export interface IndicatorSummary {
  verdict: IndicatorVerdict;
  positives: number; // how many signals point up
  total: number; // how many signals were counted
}

const mean = (points: PricePoint[]): number =>
  points.reduce((sum, p) => sum + p.priceIrt, 0) / points.length;

/**
 * Boils the chart down to simple up/down signals an ordinary person can act
 * on — five «is it heading up?» checks:
 *
 * 1. the last 24 hours gained
 * 2. the price is above its 7-day average
 * 3. the price is above its 1-month average
 * 4. the week ended higher than it started
 * 5. the month ended higher than it started
 *
 * ≥4 up → buy, ≤1 up → sell, anything between → hold. A deliberately plain
 * heuristic (this is guidance, not advice); a real signal service would
 * replace the internals, not the shape.
 */
export function summarizeIndicators(
  change24h: number,
  series: Record<ChartRange, PricePoint[]>,
): IndicatorSummary {
  const day = series["24h"];
  const week = series["7d"];
  const month = series["1m"];
  if (day.length < 2 || week.length < 2 || month.length < 2) {
    return { verdict: "hold", positives: 0, total: 0 };
  }

  const price = day[day.length - 1].priceIrt;
  const signals = [
    change24h >= 0,
    price >= mean(week),
    price >= mean(month),
    week[week.length - 1].priceIrt >= week[0].priceIrt,
    month[month.length - 1].priceIrt >= month[0].priceIrt,
  ];
  const positives = signals.filter(Boolean).length;

  return {
    verdict: positives >= 4 ? "buy" : positives <= 1 ? "sell" : "hold",
    positives,
    total: signals.length,
  };
}
