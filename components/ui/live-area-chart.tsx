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
  /**
   * When a range has no plottable points, why: `"loading"` while its data is
   * being fetched (range toggle), `"error"` if that fetch failed. Absent means
   * the range is simply empty (no history yet). Drives the in-plot status note.
   */
  status?: "loading" | "error";
}

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

/**
 * Scrub marker: a single brand-blue dot sitting ON the line at the peeked
 * point, so the finger's position reads at a glance (the axisPointer line
 * alone is easy to lose). All-null except the peeked index; hidden when not
 * scrubbing (index null). Length matches the xAxis (+1 for the live slot).
 */
function peekData(
  points: ChartPoint[],
  tones: Tones,
  index: number | null,
): LineSeriesOption["data"] {
  const data: NonNullable<LineSeriesOption["data"]> = new Array(
    points.length + 1,
  ).fill(null);
  if (index != null && index >= 0 && index < points.length) {
    data[index] = {
      value: points[index].value,
      symbol: "circle",
      symbolSize: 11,
      itemStyle: {
        color: tones.brand,
        borderColor: tones.paper,
        borderWidth: 2.5,
      },
    };
  }
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
        areaStyle: { color: tones.brandSoft }, // fill under the dotted tail too
        emphasis: { disabled: true },
        // Smooth transition when a real live update arrives (ticks are now
        // event-driven from the WS feed, not a fixed interval).
        animationDurationUpdate: 1_200,
        animationEasingUpdate: "linear",
      },
      {
        // The scrub dot. No line — just the marker; driven on peek change.
        id: "peek",
        type: "line",
        data: peekData(points, tones, null),
        symbol: "none",
        showSymbol: true,
        silent: true,
        lineStyle: { width: 0 },
        emphasis: { disabled: true },
        z: 5,
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
  toolbar,
  liveValue = null,
  fallbackValue = null,
  onRangeSelect,
}: {
  ranges: ChartRangeDef[];
  formatValue: (value: number) => string;
  ariaLabel: string;
  /** Shown in the subhead while idle (no peek); default is the moment. */
  idleSubhead?: ReactNode;
  /** Rendered top-right inside the card (the area⇄candles toggle). */
  toolbar?: ReactNode;
  /**
   * The REAL current price/value, fed by a parent subscribed to the live feed
   * (WebSocket). When set, the dotted tail tracks it; when null, the tail rests
   * on the last real history point. There is NO simulated movement — the tail
   * only moves when a real update arrives.
   */
  liveValue?: number | null;
  /**
   * Headline value shown when the active range has no plottable points (loading
   * / empty / error) — so the card still leads with the current price instead
   * of a blank. Typically the coin's live price.
   */
  fallbackValue?: number | null;
  /** Fired when a range tab is chosen — the parent lazy-loads that range's data. */
  onRangeSelect?: (key: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const liveValueRef = useRef<number | null>(null);
  const [rangeKey, setRangeKey] = useState(ranges[0].key);
  const [peek, setPeek] = useState<number | null>(null);
  // Keep the latest live value in a ref so the theme rebuild can read it without
  // re-running on every tick (synced in an effect, never mutated during render).
  useEffect(() => {
    liveValueRef.current = liveValue;
  }, [liveValue]);
  const themeClass = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.className,
    () => "",
  );

  const range = ranges.find((r) => r.key === rangeKey) ?? ranges[0];
  const points = range.points;
  // A range needs ≥2 points to draw a line. With fewer (loading / empty / error),
  // the plot is replaced by a status note and the headline falls back to the
  // live/current price — the card is never blank or crashing.
  const noPlot = points.length < 2;
  const last = points[points.length - 1];
  const isLatest = peek == null || peek >= points.length - 1 || !points[peek];
  const point = isLatest || noPlot ? last : points[peek];
  const displayValue = noPlot
    ? (liveValue ?? fallbackValue ?? 0)
    : isLatest
      ? (liveValue ?? last.value)
      : point.value;

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
    // No plottable data (loading / empty / error) → clear the canvas; the status
    // overlay takes over. Guards against indexing an empty points array.
    if (points.length < 2) {
      chartRef.current?.clear();
      return;
    }
    chartRef.current?.setOption(
      buildOption(
        points,
        readTones(),
        liveValueRef.current ?? points[points.length - 1].value,
      ),
      { notMerge: true },
    );
  }, [points, themeClass]);

  // A real live update only moves the dotted tail — the plotted history stays
  // put. No update ⇒ no movement (the tail rests on the last real point).
  useEffect(() => {
    if (liveValue == null || points.length < 2) return;
    chartRef.current?.setOption({
      series: [
        { id: "live", data: liveTailData(points, readTones(), liveValue) },
      ],
    });
  }, [liveValue, points]);

  // Move the scrub dot to the peeked point (hidden when not scrubbing).
  // themeClass is a dep so a notMerge theme rebuild doesn't drop the dot.
  const scrubIndex =
    peek != null && peek >= 0 && peek < points.length ? peek : null;
  useEffect(() => {
    if (points.length < 2) return;
    chartRef.current?.setOption({
      series: [{ id: "peek", data: peekData(points, readTones(), scrubIndex) }],
    });
  }, [scrubIndex, points, themeClass]);

  const moment =
    noPlot || !point ? null : (
      <span className="text-muted">
        {formatJalaliDay(new Date(point.at))}
        {range.showTime ? ` — ${formatTimeFa(new Date(point.at))}` : ""}
      </span>
    );

  return (
    <section
      aria-label={ariaLabel}
      className="flex h-[360px] flex-col gap-3 overflow-hidden rounded-card bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div aria-live="polite" className="flex flex-col gap-0.5">
          <span className="text-[20px] font-extrabold tabular-nums text-ink">
            {formatValue(displayValue)}
          </span>
          {/* Subhead: the peeked moment + its event, if any.
              Fixed height so the chart never jumps while scrubbing. */}
          <div className="flex h-5 items-center gap-2 text-[13px]">
            {isLatest && idleSubhead && !point?.event ? idleSubhead : moment}
            {point?.event ? (
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
        {toolbar}
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
              onRangeSelect?.(r.key);
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

      <div className="relative -mx-4 -mb-4 min-h-0 flex-1">
        <div
          dir="ltr"
          ref={el}
          role="img"
          aria-label={`${ariaLabel} — ${range.label}`}
          className="size-full touch-none"
        />
        {/* No plottable data for the active range → an honest status note over
            the (cleared) canvas, never an empty box pretending to be a chart. */}
        {noPlot ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            {range.status === "loading" ? (
              <>
                <span className="size-6 animate-spin rounded-full border-2 border-line border-t-brand" />
                <p className="text-[13px] text-muted">
                  در حال بارگذاری این بازه…
                </p>
              </>
            ) : (
              <p className="max-w-[240px] text-[14px] leading-7 text-muted">
                {range.status === "error"
                  ? "بارگذاری این بازه ناموفق بود؛ دوباره تلاش کنید."
                  : "برای این بازه هنوز داده‌ای ثبت نشده است."}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
