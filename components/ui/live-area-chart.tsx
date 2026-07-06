"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
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
import { formatJalaliDay, formatTimeFa } from "@/lib/utils/jalali";
import { readTones, subscribeToTheme, type Tones } from "./chart-theme";
import { cn } from "@/lib/utils/cn";

echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

type Option = ComposeOption<
  LineSeriesOption | GridComponentOption | TooltipComponentOption
>;

/** One plotted moment; an optional event paints a dot and names itself. */
export interface ChartPoint {
  at: number; // epoch ms
  value: number;
  /** in = money/value arriving (gain green), out = leaving (loss red). */
  event?: { label: string; direction: "in" | "out" };
}

/** One tab of the segmented range control. */
export interface ChartRangeDef {
  key: string;
  label: string;
  points: ChartPoint[];
  /** Subhead includes the time («— ۱۴:۰۵») for intraday ranges. */
  showTime?: boolean;
}

// Live tail: the newest value breathes with the market — a bounded random
// walk around the real value so it never wanders from the truth.
const LIVE_TICK_MS = 1_600;
const LIVE_STEP = 0.003; // per-tick nudge, ±0.3%
const LIVE_MAX_DRIFT = 0.015; // hard leash, ±1.5% of the real value

/**
 * Event points wear a marker dot — gain green for value in, loss red for
 * value out (the subhead text names the event, never color alone).
 */
function seriesData(
  points: ChartPoint[],
  tones: Tones,
): LineSeriesOption["data"] {
  return points.map((p) =>
    p.event
      ? {
          value: p.value,
          symbol: "circle",
          symbolSize: 9,
          itemStyle: {
            color: p.event.direction === "in" ? tones.gain : tones.loss,
            borderColor: tones.paper,
            borderWidth: 2,
          },
        }
      : p.value,
  );
}

/**
 * The live tail: a dotted segment from the last real point into a phantom
 * slot at the right edge, ending in a dot that breathes up and down with
 * the market — only the tail moves, never the plotted history.
 */
function liveTailData(
  points: ChartPoint[],
  tones: Tones,
  liveValue: number,
): LineSeriesOption["data"] {
  const data: NonNullable<LineSeriesOption["data"]> = new Array(
    points.length + 1,
  ).fill(null);
  data[points.length - 1] = {
    value: points[points.length - 1].value,
    symbol: "none",
  };
  data[points.length] = {
    value: liveValue,
    symbol: "circle",
    symbolSize: 7,
    itemStyle: { color: tones.brand, borderColor: tones.paper, borderWidth: 2 },
  };
  return data;
}

function buildOption(
  points: ChartPoint[],
  tones: Tones,
  liveValue: number,
): Option {
  return {
    animation: true,
    animationDuration: 0, // no entry animation — instant first paint
    // No global update tween: switching tabs swaps the line INSTANTLY.
    // Only the live-tail series opts back in (its own animation settings).
    animationDurationUpdate: 0,
    grid: { left: 0, right: 0, top: 8, bottom: 0 },
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
      // One phantom slot past the newest point hosts the live dotted tail.
      data: [...points.map((p) => String(p.at)), "live"],
      axisLine: { show: false },
      axisTick: { show: false },
      // No time tags — the readout above names the peeked moment.
      axisLabel: { show: false },
    },
    yAxis: {
      type: "value",
      show: false,
      // Pad past the data so the live dotted tail (leashed to ±1.5% of the
      // newest value) and its end-point dot never clip at the plot edges.
      min: (v: { min: number; max: number }) =>
        v.min - Math.max((v.max - v.min) * 0.08, v.min * 0.02),
      max: (v: { min: number; max: number }) =>
        v.max + Math.max((v.max - v.min) * 0.08, v.max * 0.02),
    },
    series: [
      {
        id: "history",
        type: "line",
        data: seriesData(points, tones),
        smooth: 0.3,
        smoothMonotone: "x", // no overshoot on event steps
        symbol: "none",
        showSymbol: true,
        lineStyle: { width: 2.5, color: tones.brand },
        areaStyle: { color: tones.brandSoft },
        emphasis: { disabled: true },
      },
      {
        id: "live",
        type: "line",
        data: liveTailData(points, tones, liveValue),
        symbol: "none",
        showSymbol: true,
        silent: true,
        lineStyle: { type: "dotted", width: 2, color: tones.brand },
        emphasis: { disabled: true },
        animationDurationUpdate: LIVE_TICK_MS * 0.75,
        animationEasingUpdate: "linear",
      },
    ],
  };
}

/**
 * Live value-over-time chart, boxed Apple-style: an inset surface card,
 * headline value on top with the peeked moment as a subhead, an iOS-like
 * segmented range control, and a full-bleed chart at the bottom. No tooltip
 * popup: scrubbing (finger or mouse) writes the peeked point into the
 * readout; event points show as colored dots and name themselves in the
 * subhead. The newest value ticks live via a dotted tail. Flows LTR
 * (old → new) as trading charts conventionally do, even in an RTL app.
 */
export function LiveAreaChart({
  ranges,
  formatValue,
  ariaLabel,
  idleSubhead,
}: {
  ranges: ChartRangeDef[];
  formatValue: (value: number) => string;
  ariaLabel: string;
  /** Shown in the subhead while idle (no peek); default is the moment. */
  idleSubhead?: ReactNode;
}) {
  const el = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const driftRef = useRef(0);
  const liveValueRef = useRef<number | null>(null);
  const [rangeKey, setRangeKey] = useState(ranges[0].key);
  const [peek, setPeek] = useState<number | null>(null);
  const [liveValue, setLiveValue] = useState<number | null>(null);
  const themeClass = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.className,
    () => "",
  );

  const range = ranges.find((r) => r.key === rangeKey) ?? ranges[0];
  const points = range.points;
  const last = points[points.length - 1];
  const isLatest = peek == null || peek >= points.length - 1 || !points[peek];
  const point = isLatest ? last : points[peek];
  const displayValue = isLatest ? (liveValue ?? last.value) : point.value;

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
      buildOption(
        points,
        readTones(),
        liveValueRef.current ?? points[points.length - 1].value,
      ),
      { notMerge: true },
    );
  }, [points, themeClass]);

  // Live market tick — a leashed random walk around the real newest value.
  useEffect(() => {
    const base = points[points.length - 1].value;
    const id = setInterval(() => {
      const step = (Math.random() - 0.5) * 2 * LIVE_STEP;
      driftRef.current = Math.min(
        LIVE_MAX_DRIFT,
        Math.max(-LIVE_MAX_DRIFT, driftRef.current + step),
      );
      const next = Math.round(base * (1 + driftRef.current));
      liveValueRef.current = next;
      setLiveValue(next);
    }, LIVE_TICK_MS);
    return () => clearInterval(id);
  }, [points]);

  // Each tick only moves the dotted tail — the plotted history stays put.
  useEffect(() => {
    if (liveValue == null) return;
    chartRef.current?.setOption({
      series: [
        { id: "live", data: liveTailData(points, readTones(), liveValue) },
      ],
    });
  }, [liveValue, points]);

  const moment = (
    <span className="text-muted">
      {formatJalaliDay(new Date(point.at))}
      {range.showTime ? ` — ${formatTimeFa(new Date(point.at))}` : ""}
    </span>
  );

  return (
    <section
      aria-label={ariaLabel}
      className="flex flex-col gap-3 overflow-hidden rounded-card bg-surface p-4"
    >
      <div aria-live="polite" className="flex flex-col gap-0.5">
        <span className="text-[20px] font-extrabold tabular-nums text-ink">
          {formatValue(displayValue)}
        </span>
        {/* Subhead: the peeked moment + its event, if any.
            Fixed height so the chart never jumps while scrubbing. */}
        <div className="flex h-5 items-center gap-2 text-[13px]">
          {isLatest && idleSubhead && !point.event ? idleSubhead : moment}
          {point.event ? (
            <span
              className={cn(
                "font-bold",
                point.event.direction === "out" ? "text-loss" : "text-gain",
              )}
            >
              {point.event.label}
            </span>
          ) : null}
        </div>
      </div>

      {/* iOS-style segmented control: sliding paper thumb on a line track. */}
      <div className="flex rounded-full bg-line p-1">
        {ranges.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => {
              setRangeKey(r.key);
              setPeek(null);
            }}
            aria-pressed={r.key === range.key}
            className={cn(
              "h-10 flex-1 rounded-full text-[13px] font-bold transition-colors",
              r.key === range.key
                ? "bg-paper text-ink shadow-sm"
                : "text-muted",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div
        dir="ltr"
        ref={el}
        role="img"
        aria-label={`${ariaLabel} — ${range.label}`}
        className="-mx-4 -mb-4 h-[160px] touch-none"
      />
    </section>
  );
}
