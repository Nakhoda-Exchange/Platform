import { CHART_RANGES, type ChartRange, type PricePoint } from "./coin-detail";

/** How much the price moved over one chart range, end vs start. */
export interface PeriodPerformance {
  range: ChartRange;
  changePercent: number; // signed, e.g. -3.2
}

/**
 * Past performance per chart range: the percent move from the first to the
 * last point of each series. Ranges without enough data are skipped rather
 * than shown as a fake zero.
 */
export function pastPerformance(
  series?: Record<ChartRange, PricePoint[]>,
): PeriodPerformance[] {
  return CHART_RANGES.flatMap((range) => {
    const points = series?.[range] ?? [];
    if (points.length < 2 || points[0].priceIrt <= 0) return [];
    const first = points[0].priceIrt;
    const last = points[points.length - 1].priceIrt;
    return [{ range, changePercent: ((last - first) / first) * 100 }];
  });
}
