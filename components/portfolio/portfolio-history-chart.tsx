"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as echarts from "echarts/core";
import { LineChart, type LineSeriesOption } from "echarts/charts";
import {
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
  type GridComponentOption,
  type MarkLineComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import {
  PORTFOLIO_HISTORY_RANGES,
  type PortfolioHistory,
  type PortfolioHistoryRange,
  type PortfolioValuePoint,
} from "@/lib/core/domain/portfolio/portfolio-history";
import { formatIrtShort } from "@/lib/utils/money";
import {
  formatJalaliDay,
  formatJalaliDayShort,
  formatTimeFa,
} from "@/lib/utils/jalali";
import { cn } from "@/lib/utils/cn";

echarts.use([
  LineChart,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
  SVGRenderer,
]);

type Option = ComposeOption<
  | LineSeriesOption
  | GridComponentOption
  | MarkLineComponentOption
  | TooltipComponentOption
>;

const RANGE_LABELS: Record<PortfolioHistoryRange, string> = {
  daily: "روزانه",
  weekly: "هفتگی",
  monthly: "ماهانه",
};

// Live tail: the newest point breathes with the market — a bounded random
// walk around the real total so it never wanders from the truth.
const LIVE_TICK_MS = 1_600;
const LIVE_STEP = 0.003; // per-tick nudge, ±0.3%
const LIVE_MAX_DRIFT = 0.015; // hard leash, ±1.5% of the real total

/** Concrete colors for ECharts — it can't consume `var(--x)` strings. */
interface Tones {
  brand: string;
  brandSoft: string;
  muted: string;
  paper: string;
  gain: string;
  loss: string;
}

function readTones(): Tones {
  const style = getComputedStyle(document.documentElement);
  return {
    brand: style.getPropertyValue("--color-brand").trim() || "#0023fb",
    brandSoft:
      style.getPropertyValue("--color-brand-soft").trim() ||
      "rgba(0,35,251,0.05)",
    muted: style.getPropertyValue("--color-muted").trim() || "#696969",
    paper: style.getPropertyValue("--color-paper").trim() || "#ffffff",
    gain: style.getPropertyValue("--color-gain").trim() || "#15803d",
    loss: style.getPropertyValue("--color-loss").trim() || "#b91c1c",
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

/**
 * Deposit/withdraw points wear a marker dot — gain green for money in, loss
 * red for money out (the readout text names the type, never color alone).
 */
function seriesData(
  points: PortfolioValuePoint[],
  tones: Tones,
): LineSeriesOption["data"] {
  return points.map((p) =>
    p.event
      ? {
          value: p.valueIrt,
          symbol: "circle",
          symbolSize: 9,
          itemStyle: {
            color: p.event.type === "deposit" ? tones.gain : tones.loss,
            borderColor: tones.paper,
            borderWidth: 2,
          },
        }
      : p.valueIrt,
  );
}

/** Apple-Stocks-style live level: a dotted line that breathes, not the chart. */
function liveMarkLine(
  liveIrt: number,
  tones: Tones,
): LineSeriesOption["markLine"] {
  return {
    silent: true,
    symbol: "none",
    animationDurationUpdate: LIVE_TICK_MS * 0.75,
    animationEasingUpdate: "linear",
    label: { show: false },
    lineStyle: { type: "dotted", color: tones.brand, width: 1.5 },
    data: [{ yAxis: liveIrt }],
  };
}

function buildOption(
  points: PortfolioValuePoint[],
  range: PortfolioHistoryRange,
  tones: Tones,
  liveIrt: number,
): Option {
  return {
    animation: true,
    animationDuration: 0, // no entry animation — instant first paint
    animationDurationUpdate: LIVE_TICK_MS * 0.75, // the live line glides
    animationEasingUpdate: "linear",
    grid: { left: 0, right: 0, top: 8, bottom: 22 },
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
        // Full-bleed grid: keep the edge labels inside the plot.
        alignMinLabel: "left",
        alignMaxLabel: "right",
        interval: Math.floor(points.length / 3),
        formatter: (ms: string) => {
          const d = new Date(Number(ms));
          return range === "daily" ? formatTimeFa(d) : formatJalaliDayShort(d);
        },
      },
    },
    yAxis: {
      type: "value",
      show: false,
      // Pad past the data so the live dotted line (leashed to ±1.5% of the
      // newest value) and its end-point dot never clip at the plot edges.
      min: (v: { min: number; max: number }) =>
        v.min - Math.max((v.max - v.min) * 0.08, v.min * 0.02),
      max: (v: { min: number; max: number }) =>
        v.max + Math.max((v.max - v.min) * 0.08, v.max * 0.02),
    },
    series: [
      {
        type: "line",
        data: seriesData(points, tones),
        smooth: 0.3,
        smoothMonotone: "x", // no overshoot on deposit/withdraw steps
        symbol: "none",
        showSymbol: true,
        lineStyle: { width: 2.5, color: tones.brand },
        areaStyle: { color: tones.brandSoft },
        emphasis: { disabled: true },
        markLine: liveMarkLine(liveIrt, tones),
      },
    ],
  };
}

/**
 * Account-value chart for the details sheet, boxed Apple-style: an inset
 * surface card, headline value on top, full-bleed chart, and an iOS-like
 * segmented range control. No tooltip popup: scrubbing (finger or mouse)
 * writes the peeked point into the readout row; deposits/withdrawals show
 * as colored dots and name themselves in the readout when peeked. The
 * newest point ticks live. Flows LTR (old → new) as trading charts
 * conventionally do, even in an RTL app.
 */
export function PortfolioHistoryChart({
  history,
}: {
  history: PortfolioHistory;
}) {
  const el = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const driftRef = useRef(0);
  const liveIrtRef = useRef<number | null>(null);
  const [range, setRange] = useState<PortfolioHistoryRange>("daily");
  const [peek, setPeek] = useState<number | null>(null);
  const [liveIrt, setLiveIrt] = useState<number | null>(null);
  const themeClass = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.className,
    () => "",
  );

  const points = history[range];
  const last = points[points.length - 1];
  const isLatest = peek == null || peek >= points.length - 1 || !points[peek];
  const point = isLatest ? last : points[peek];
  const displayIrt = isLatest ? (liveIrt ?? last.valueIrt) : point.valueIrt;

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
    const points = history[range];
    chartRef.current?.setOption(
      buildOption(
        points,
        range,
        readTones(),
        liveIrtRef.current ?? points[points.length - 1].valueIrt,
      ),
      { notMerge: true },
    );
  }, [history, range, themeClass]);

  // Live market tick — a leashed random walk around the real total.
  useEffect(() => {
    const base = history[range][history[range].length - 1].valueIrt;
    const id = setInterval(() => {
      const step = (Math.random() - 0.5) * 2 * LIVE_STEP;
      driftRef.current = Math.min(
        LIVE_MAX_DRIFT,
        Math.max(-LIVE_MAX_DRIFT, driftRef.current + step),
      );
      const next = Math.round(base * (1 + driftRef.current));
      liveIrtRef.current = next;
      setLiveIrt(next);
    }, LIVE_TICK_MS);
    return () => clearInterval(id);
  }, [history, range]);

  // Each tick only moves the dotted level line — the chart itself stays put.
  useEffect(() => {
    if (liveIrt == null) return;
    chartRef.current?.setOption({
      series: [{ markLine: liveMarkLine(liveIrt, readTones()) }],
    });
  }, [liveIrt]);

  return (
    <section
      aria-label="نمودار ارزش دارایی"
      className="flex flex-col gap-3 overflow-hidden rounded-card bg-surface p-4"
    >
      <div aria-live="polite" className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[20px] font-extrabold tabular-nums text-ink">
            {formatIrtShort(displayIrt)}
          </span>
          <span className="text-[13px] text-muted">
            {formatJalaliDay(new Date(point.at))}
            {range === "daily" ? ` — ${formatTimeFa(new Date(point.at))}` : ""}
          </span>
        </div>
        {/* Fixed height so the chart never jumps while scrubbing. */}
        <div
          className={cn(
            "flex h-5 items-center text-[13px] font-bold",
            point.event?.type === "withdraw" ? "text-loss" : "text-gain",
          )}
        >
          {point.event
            ? `${point.event.type === "deposit" ? "واریز" : "برداشت"} ${formatIrtShort(point.event.amountIrt)}`
            : null}
        </div>
      </div>

      <div
        dir="ltr"
        ref={el}
        role="img"
        aria-label={`نمودار ${RANGE_LABELS[range]} ارزش دارایی`}
        className="-mx-4 h-[170px] touch-none"
      />

      {/* iOS-style segmented control: sliding paper thumb on a line track. */}
      <div className="flex rounded-full bg-line p-1">
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
              r === range ? "bg-paper text-ink shadow-sm" : "text-muted",
            )}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>
    </section>
  );
}
