"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as echarts from "echarts/core";
import { LineChart, type LineSeriesOption } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import {
  PORTFOLIO_HISTORY_RANGES,
  type PortfolioHistory,
  type PortfolioHistoryRange,
} from "@/lib/core/domain/portfolio/portfolio-history";
import { formatIrtShort } from "@/lib/utils/money";
import {
  formatJalaliDay,
  formatJalaliDayShort,
  formatTimeFa,
} from "@/lib/utils/jalali";
import { cn } from "@/lib/utils/cn";

echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

type Option = ComposeOption<
  LineSeriesOption | GridComponentOption | TooltipComponentOption
>;

const RANGE_LABELS: Record<PortfolioHistoryRange, string> = {
  daily: "روزانه",
  weekly: "هفتگی",
  monthly: "ماهانه",
};

/** Concrete colors for ECharts — it can't consume `var(--x)` strings. */
interface Tones {
  brand: string;
  brandSoft: string;
  muted: string;
}

function readTones(): Tones {
  const style = getComputedStyle(document.documentElement);
  return {
    brand: style.getPropertyValue("--color-brand").trim() || "#0023fb",
    brandSoft:
      style.getPropertyValue("--color-brand-soft").trim() ||
      "rgba(0,35,251,0.05)",
    muted: style.getPropertyValue("--color-muted").trim() || "#696969",
  };
}

// The root `.dark` class flips tokens (account picker or OS theme); watching
// it as an external store re-renders the chart with freshly read tones.
function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function buildOption(
  points: PortfolioHistory[PortfolioHistoryRange],
  range: PortfolioHistoryRange,
  tones: Tones,
): Option {
  return {
    animation: false, // instant scrub response
    grid: { left: 6, right: 6, top: 10, bottom: 24 },
    tooltip: {
      trigger: "axis",
      showContent: false, // the readout row above the chart IS the tooltip
      axisPointer: {
        type: "line",
        snap: true,
        lineStyle: { color: tones.muted, width: 1 },
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: points.map((p) => String(p.at)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: tones.muted,
        fontFamily: "Vazirmatn, sans-serif",
        fontSize: 11,
        hideOverlap: true,
        showMinLabel: true,
        showMaxLabel: true,
        interval: Math.floor(points.length / 3),
        formatter: (ms: string) => {
          const d = new Date(Number(ms));
          return range === "daily" ? formatTimeFa(d) : formatJalaliDayShort(d);
        },
      },
    },
    yAxis: { type: "value", show: false, min: "dataMin", max: "dataMax" },
    series: [
      {
        type: "line",
        data: points.map((p) => p.valueIrt),
        showSymbol: false,
        lineStyle: { width: 2.5, color: tones.brand },
        areaStyle: { color: tones.brandSoft },
        emphasis: { disabled: true },
      },
    ],
  };
}

/**
 * Account-value chart for the details sheet. No tooltip popup: scrubbing
 * (finger or mouse) writes the peeked point into the readout row above the
 * chart; with no peek it shows the latest point (= «دارایی کل»). Flows LTR
 * (old → new) as trading charts conventionally do, even in an RTL app.
 */
export function PortfolioHistoryChart({
  history,
}: {
  history: PortfolioHistory;
}) {
  const el = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [range, setRange] = useState<PortfolioHistoryRange>("daily");
  const [peek, setPeek] = useState<number | null>(null);
  const themeClass = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.className,
    () => "",
  );

  const points = history[range];
  const point =
    peek != null && points[peek] ? points[peek] : points[points.length - 1];

  useEffect(() => {
    const chart = echarts.init(el.current!, null, { renderer: "svg" });
    chartRef.current = chart;
    chart.on("updateAxisPointer", (event) => {
      const axis = (event as { axesInfo?: { value: number }[] }).axesInfo?.[0];
      if (axis) setPeek(Math.round(axis.value));
    });
    chart.getZr().on("globalout", () => setPeek(null));
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(el.current!);

    return () => {
      resize.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  // Re-read tones on every apply: they are what themeClass changes.
  useEffect(() => {
    void themeClass;
    chartRef.current?.setOption(
      buildOption(history[range], range, readTones()),
      { notMerge: true },
    );
  }, [history, range, themeClass]);

  return (
    <section className="flex flex-col gap-3" aria-label="نمودار ارزش دارایی">
      <div aria-live="polite" className="flex items-baseline justify-between">
        <span className="text-[17px] font-extrabold text-ink">
          {formatIrtShort(point.valueIrt)}
        </span>
        <span className="text-[13px] text-muted">
          {formatJalaliDay(new Date(point.at))}
          {range === "daily" ? ` — ${formatTimeFa(new Date(point.at))}` : ""}
        </span>
      </div>

      <div
        dir="ltr"
        ref={el}
        role="img"
        aria-label={`نمودار ${RANGE_LABELS[range]} ارزش دارایی`}
        className="h-[160px] w-full touch-none"
      />

      <div className="flex justify-between gap-2">
        {PORTFOLIO_HISTORY_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRange(r);
              setPeek(null);
            }}
            aria-pressed={r === range}
            className={cn(
              "h-10 flex-1 rounded-full text-[13px] font-bold transition-colors",
              r === range
                ? "bg-brand text-white"
                : "bg-surface text-muted hover:bg-line",
            )}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>
    </section>
  );
}
