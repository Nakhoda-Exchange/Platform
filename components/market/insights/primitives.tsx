import type { ReactNode } from "react";
import type { Metric, Source } from "@/lib/core/domain/insights/token-insights";
import { toPersianDigits } from "@/lib/utils/digits";
import { formatIrt, formatUsd } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/**
 * Shared render primitives for the insight panels. Server components (no
 * interactivity): a metric is either a value + freshness, or an explicit
 * «در دسترس نیست». Copy is factual — signals with context, never advice.
 */

const SOURCE_LABEL: Record<Source, string> = {
  dexscreener: "DexScreener",
  birdeye: "Birdeye",
  rugcheck: "RugCheck",
  helius: "Helius",
  moralis: "Moralis",
  goplus: "GoPlus",
  nakhoda: "ناخدا",
  derived: "محاسبه‌ی ناخدا",
};

/** Relative time in Persian. Server-rendered, so `Date.now()` is safe here. */
export function relTime(ts: number | null): string {
  if (ts == null) return "";
  const m = Math.max(0, Math.floor((Date.now() - ts) / 60_000));
  if (m < 1) return "همین حالا";
  if (m < 60) return `${toPersianDigits(m)} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${toPersianDigits(h)} ساعت پیش`;
  return `${toPersianDigits(Math.floor(h / 24))} روز پیش`;
}

// ── formatters ──────────────────────────────────────────────────────────────
export const usd = (v: number): string => formatUsd(Math.round(v));
export const irt = (v: number): string => formatIrt(Math.round(v));
export const pct = (v: number): string => `${toPersianDigits(v.toFixed(1))}٪`;
export const pctFromRatio = (v: number): string =>
  `${toPersianDigits((v * 100).toFixed(0))}٪`;
export const mult = (v: number): string => `${toPersianDigits(v.toFixed(1))}×`;
export const count = (v: number): string =>
  toPersianDigits(new Intl.NumberFormat("en-US").format(Math.round(v)));

export function ageFa(ms: number): string {
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${toPersianDigits(days)} روز`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${toPersianDigits(hours)} ساعت`;
  return `${toPersianDigits(Math.max(1, Math.floor(ms / 60_000)))} دقیقه`;
}

export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-extrabold text-ink">{title}</h3>
        {subtitle ? (
          <span className="text-[12px] text-muted">{subtitle}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** A muted "unavailable" chip — shown per metric, never fabricated. */
export function Unavailable() {
  return <span className="text-[13px] text-placeholder">در دسترس نیست</span>;
}

function StaleDot() {
  return (
    <span
      aria-label="داده قدیمی"
      className="inline-block size-1.5 shrink-0 rounded-full bg-loss/70"
    />
  );
}

/** Label ↔ value row for one metric. Unavailable/stale handled here. */
export function MetricRow<T>({
  label,
  metric,
  render,
  tone,
}: {
  label: string;
  metric: Metric<T>;
  render: (v: T) => ReactNode;
  tone?: "ink" | "gain" | "loss";
}) {
  const missing = metric.status === "unavailable" || metric.value == null;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="flex items-center gap-1.5 text-[13px] text-muted">
        {label}
        {metric.status === "stale" ? <StaleDot /> : null}
      </span>
      {missing ? (
        <Unavailable />
      ) : (
        <span
          dir="ltr"
          className={cn(
            "text-[14px] font-bold tabular-nums",
            tone === "gain" && "text-gain",
            tone === "loss" && "text-loss",
            (!tone || tone === "ink") && "text-ink",
          )}
        >
          {render(metric.value as T)}
        </span>
      )}
    </div>
  );
}

/** Source + freshness footnote, from the available metrics in a panel. */
export function SourceFootnote({ metrics }: { metrics: Metric<unknown>[] }) {
  const available = metrics.filter(
    (m) => m.status !== "unavailable" && m.lastUpdatedAt != null,
  );
  if (available.length === 0) return null;
  const sources = [
    ...new Set(available.map((m) => SOURCE_LABEL[m.source])),
  ].join("، ");
  const newest = Math.max(...available.map((m) => m.lastUpdatedAt as number));
  return (
    <p className="text-[11px] text-placeholder">
      منبع: {sources} · {relTime(newest)}
    </p>
  );
}
