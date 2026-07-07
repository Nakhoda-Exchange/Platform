import type { ChartRange, PricePoint } from "./coin-detail";

export type IndicatorVerdict = "buy" | "hold" | "sell";

/** One «is it heading up?» check, worded for the explain sheet. */
export interface IndicatorSignal {
  label: string; // what it checks, e.g. «قیمت بالاتر از میانگین ۷ روزه»
  positive: boolean; // true → points up
}

export interface IndicatorSummary {
  verdict: IndicatorVerdict;
  positives: number; // how many signals point up
  total: number; // how many signals were counted
  signals: IndicatorSignal[]; // each check, for the explain sheet
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
    return { verdict: "hold", positives: 0, total: 0, signals: [] };
  }

  const price = day[day.length - 1].priceIrt;
  const signals: IndicatorSignal[] = [
    { label: "رشد قیمت در ۲۴ ساعت گذشته", positive: change24h >= 0 },
    { label: "قیمت بالاتر از میانگین ۷ روزه", positive: price >= mean(week) },
    { label: "قیمت بالاتر از میانگین ۱ ماهه", positive: price >= mean(month) },
    {
      label: "پایان هفته بالاتر از ابتدای آن",
      positive: week[week.length - 1].priceIrt >= week[0].priceIrt,
    },
    {
      label: "پایان ماه بالاتر از ابتدای آن",
      positive: month[month.length - 1].priceIrt >= month[0].priceIrt,
    },
  ];
  const positives = signals.filter((s) => s.positive).length;

  return {
    verdict: positives >= 4 ? "buy" : positives <= 1 ? "sell" : "hold",
    positives,
    total: signals.length,
    signals,
  };
}
