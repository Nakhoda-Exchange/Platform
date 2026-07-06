"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

/**
 * PDP candlestick view: OHLC candles in the house tones (gain up / loss
 * down), the same segmented range control as the area chart, and a tap/scrub
 * tooltip naming the candle's moment and its OHLC. Theme-aware like every
 * chart (re-renders on `.dark` flips).
 */
export function CandleChart({
  ranges,
  formatValue,
  ariaLabel,
}: {
  ranges: CandleRangeDef[];
  formatValue: (value: number) => string;
  ariaLabel: string;
}) {
  const [rangeKey, setRangeKey] = useState(ranges[0]?.key ?? "");
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
      grid: { left: 4, right: 46, top: 8, bottom: 24 },
      xAxis: {
        type: "category",
        data: range.candles.map((c) => String(c.at)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: tones.muted,
          fontSize: 10,
          formatter: (value: string) => {
            const at = new Date(Number(value));
            return range.showTime
              ? formatTimeFa(at)
              : formatJalaliDay(at).split(" ").slice(0, 2).join(" ");
          },
        },
      },
      yAxis: {
        type: "value",
        scale: true,
        position: "right",
        splitLine: { lineStyle: { color: tones.brandSoft } },
        axisLabel: {
          color: tones.muted,
          fontSize: 10,
          formatter: (v: number) =>
            v >= 1_000_000
              ? `${Math.round(v / 1_000_000)}M`
              : `${Math.round(v / 1_000)}K`,
        },
      },
      tooltip: {
        trigger: "axis",
        confine: true,
        backgroundColor: tones.paper,
        borderColor: tones.brandSoft,
        textStyle: { color: tones.muted, fontSize: 12 },
        formatter: (params) => {
          const p = Array.isArray(params) ? params[0] : params;
          const candle = range.candles[p.dataIndex as number];
          if (!candle) return "";
          const at = new Date(candle.at);
          const when = range.showTime
            ? `${formatJalaliDay(at)} — ${formatTimeFa(at)}`
            : formatJalaliDay(at);
          const row = (label: string, value: number) =>
            `<div style="display:flex;justify-content:space-between;gap:12px">` +
            `<span>${label}</span><b>${formatValue(value)}</b></div>`;
          return (
            `<div dir="rtl" style="min-width:190px">` +
            `<div style="margin-bottom:4px">${when}</div>` +
            row("باز شدن", candle.open) +
            row("بیشترین", candle.high) +
            row("کمترین", candle.low) +
            row("بسته شدن", candle.close) +
            `</div>`
          );
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

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, [range, formatValue, theme]);

  return (
    <section
      aria-label={ariaLabel}
      className="flex flex-col gap-3 overflow-hidden rounded-card bg-surface p-4"
    >
      <div ref={containerRef} dir="ltr" className="h-[260px] w-full" />

      {/* iOS-style segmented control — identical to the area chart's. */}
      <div className="flex rounded-full bg-line p-1">
        {ranges.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRangeKey(r.key)}
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
    </section>
  );
}
