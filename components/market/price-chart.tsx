"use client";

import { useState } from "react";
import {
  CHART_RANGES,
  type ChartRange,
} from "@/lib/core/domain/market/coin-detail";
import { cn } from "@/lib/utils/cn";

const RANGE_LABELS: Record<ChartRange, string> = {
  "24h": "۲۴ ساعت",
  "7d": "۷ روز",
  "1m": "۱ ماه",
  "1y": "۱ سال",
};

const W = 358;
const H = 150;
const PAD = 14;

/** Line + area path for a value series, scaled to the viewBox. */
function buildPath(values: number[]): { line: string; area: string } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - PAD - ((v - min) / span) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p}`).join(" ");
  return { line, area: `${line} L${W},${H} L0,${H} Z` };
}

/**
 * Coin price chart with a range switcher. Mock series arrive from the server;
 * switching range swaps arrays client-side (no round-trip). Chart flows LTR
 * (old → new) as trading charts conventionally do, even in an RTL app.
 */
export function PriceChart({
  series,
}: {
  series: Record<ChartRange, number[]>;
}) {
  const [range, setRange] = useState<ChartRange>("24h");
  const { line, area } = buildPath(series[range]);

  return (
    <div className="flex flex-col gap-4">
      <div dir="ltr">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[150px] w-full"
          preserveAspectRatio="none"
          aria-label={`نمودار قیمت ${RANGE_LABELS[range]}`}
          role="img"
        >
          <path d={area} fill="var(--color-brand)" fillOpacity="0.1" />
          <path
            d={line}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex justify-between gap-2">
        {CHART_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            aria-pressed={r === range}
            className={cn(
              "h-10 flex-1 rounded-full text-[13px] font-bold transition-colors",
              r === range
                ? "bg-brand text-white"
                : "bg-surface text-muted hover:bg-gray-100",
            )}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>
    </div>
  );
}
