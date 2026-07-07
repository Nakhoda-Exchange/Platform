"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import * as echarts from "echarts/core";
import { CandlestickChart, type CandlestickSeriesOption } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import type { Candle } from "@/lib/core/domain/market/coin-detail";
import { readTones, subscribeToTheme } from "./chart-theme";
import { formatJalaliDay, formatTimeFa } from "@/lib/utils/jalali";
import { cn } from "@/lib/utils/cn";

echarts.use([CandlestickChart, GridComponent, TooltipComponent, SVGRenderer]);

type Option = ComposeOption<
  CandlestickSeriesOption | GridComponentOption | TooltipComponentOption
>;

/** One tab of the segmented range control. */
export interface CandleRangeDef {
  key: string;
  label: string;
  candles: Candle[];
  /** Tooltip includes the time («— ۱۴:۰۵») for intraday ranges. */
  showTime?: boolean;
}

/** Short OHLC labels for the readout above the chart. */
const OHLC = [
  { key: "open", label: "باز", tone: "text-ink" },
  { key: "high", label: "اوج", tone: "text-gain" },
  { key: "low", label: "کف", tone: "text-loss" },
  { key: "close", label: "بسته", tone: "" }, // colored by direction
] as const;

/**
 * PDP candlestick view: OHLC candles in the house tones (gain up / loss
 * down), the same segmented range control as the area chart. Scrubbing writes
 * the peeked candle's moment + OHLC into the readout ABOVE the chart (no popup
 * — like the area chart's headline). Theme-aware (re-renders on `.dark` flips).
 */
export function CandleChart({
  ranges,
  formatValue,
  ariaLabel,
  toolbar,
}: {
  ranges: CandleRangeDef[];
  formatValue: (value: number) => string;
  ariaLabel: string;
  /** Rendered top-right inside the card (the area⇄candles toggle). */
  toolbar?: ReactNode;
}) {
  const [rangeKey, setRangeKey] = useState(ranges[0]?.key ?? "");
  const [peek, setPeek] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const range = ranges.find((r) => r.key === rangeKey) ?? ranges[0];

  const theme = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || range.candles.length === 0) return;
    const tones = readTones();
    const chart = echarts.init(el, undefined, { renderer: "svg" });
    chartRef.current = chart;

    const option: Option = {
      animation: false,
      textStyle: { fontFamily: tones.font },
      // Full-bleed like the area chart — no axis labels, the readout above
      // names the moment and prices.
      grid: { left: 0, right: 0, top: 8, bottom: 8 },
      xAxis: {
        type: "category",
        data: range.candles.map((c) => String(c.at)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLine: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      tooltip: {
        trigger: "axis",
        // No popup: scrubbing feeds the readout above the chart. Only the
        // crosshair remains, matching the area chart's peek behaviour.
        showContent: false,
        axisPointer: {
          type: "line",
          snap: true,
          lineStyle: { color: tones.muted, width: 1 },
        },
      },
      series: [
        {
          type: "candlestick",
          data: range.candles.map((c) => [c.open, c.close, c.low, c.high]),
          itemStyle: {
            color: tones.gain, // bullish body
            color0: tones.loss, // bearish body
            borderColor: tones.gain,
            borderColor0: tones.loss,
          },
          barWidth: "60%",
        },
      ],
    };
    chart.setOption(option);

    // Scrubbing writes the hovered candle index into the readout above.
    chart.on("updateAxisPointer", (event) => {
      const axis = (event as { axesInfo?: { value: number }[] }).axesInfo?.[0];
      if (axis) setPeek(Math.round(axis.value));
    });
    chart.getZr().on("globalout", () => setPeek(null));

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, [range, formatValue, theme]);

  const candles = range.candles;
  const active =
    peek != null && candles[peek] ? candles[peek] : candles[candles.length - 1];
  const when = active
    ? range.showTime
      ? `${formatJalaliDay(new Date(active.at))} — ${formatTimeFa(new Date(active.at))}`
      : formatJalaliDay(new Date(active.at))
    : "";
  const closeUp = active ? active.close >= active.open : true;

  return (
    <section
      aria-label={ariaLabel}
      className="flex h-[360px] flex-col gap-3 overflow-hidden rounded-card bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          aria-live="polite"
          className="flex min-w-0 flex-1 flex-col gap-0.5"
        >
          <span className="text-[13px] text-muted">{when}</span>
          {/* Full-width rows: a 10-digit toman price gets the whole card width
              so it never truncates (2 columns clipped it on mobile). */}
          {OHLC.map(({ key, label, tone }) => (
            <div
              key={key}
              className="flex items-baseline justify-between gap-2 text-[13px]"
            >
              <span className="text-muted">{label}</span>
              <b
                className={cn(
                  "tabular-nums",
                  tone || (closeUp ? "text-gain" : "text-loss"),
                )}
              >
                {active ? formatValue(active[key]) : "—"}
              </b>
            </div>
          ))}
        </div>
        {toolbar}
      </div>

      {/* iOS-style segmented control — identical to the area chart's. */}
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
        ref={containerRef}
        dir="ltr"
        className="-mx-4 -mb-4 min-h-0 flex-1 touch-none"
      />
    </section>
  );
}
