import type { IndicatorSummary } from "@/lib/core/domain/market/indicator-summary";
import { toPersianDigits } from "@/lib/utils/digits";
import { cn } from "@/lib/utils/cn";

/** The five rungs, strong-sell → strong-buy (LTR: red left, green right). */
const STEPS = [
  { label: "فروش قوی", tone: "loss" },
  { label: "فروش", tone: "loss" },
  { label: "خنثی", tone: "neutral" },
  { label: "خرید", tone: "gain" },
  { label: "خرید قوی", tone: "gain" },
] as const;

const BAR_ACTIVE: Record<string, string> = {
  loss: "bg-loss",
  neutral: "bg-muted",
  gain: "bg-gain",
};
const BAR_IDLE: Record<string, string> = {
  loss: "bg-loss/20",
  neutral: "bg-line",
  gain: "bg-gain/20",
};
const TEXT_ACTIVE: Record<string, string> = {
  loss: "text-loss",
  neutral: "text-ink",
  gain: "text-gain",
};

/** positives 0..total → one of the five rungs (the middle counts share «خنثی»). */
function stepIndex({ positives, total }: IndicatorSummary): number {
  if (total <= 0) return 2;
  if (positives <= 0) return 0;
  if (positives === 1) return 1;
  if (positives >= total) return 4;
  if (positives === total - 1) return 3;
  return 2;
}

/**
 * «راهنمای معامله» — the simple signals boiled down to a five-rung scale
 * (فروش قوی → خرید قوی) with the current rung lit up. The headline names the
 * rung, the count says how many signals point up, and an honest «تصمیم با
 * شماست» closes it. Colour echoes the words for direction, never replaces them.
 */
export function IndicatorSummaryCard({
  summary,
}: {
  summary: IndicatorSummary;
}) {
  if (summary.total === 0) return null; // not enough data — say nothing

  const idx = stepIndex(summary);
  const active = STEPS[idx];

  return (
    <section aria-label="راهنمای معامله" className="flex flex-col gap-2">
      <h2 className="text-[16px] font-bold text-ink">راهنمای معامله</h2>
      <div className="flex flex-col gap-4 rounded-card bg-surface p-4">
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={cn(
              "text-[20px] font-extrabold",
              TEXT_ACTIVE[active.tone],
            )}
          >
            {active.label}
          </span>
          <span className="text-[12px] text-muted">
            {toPersianDigits(summary.positives)} از{" "}
            {toPersianDigits(summary.total)} نشانه مثبت
          </span>
        </div>

        {/* Five rungs, sell-red on the left → buy-green on the right. */}
        <div
          dir="ltr"
          role="img"
          aria-label={`${active.label}؛ ${toPersianDigits(summary.positives)} از ${toPersianDigits(summary.total)} نشانه مثبت`}
          className="grid grid-cols-5 gap-1.5"
        >
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "h-2 w-full rounded-full transition-colors",
                  i === idx ? BAR_ACTIVE[s.tone] : BAR_IDLE[s.tone],
                )}
              />
              <span
                className={cn(
                  "text-center text-[10px] leading-tight",
                  i === idx
                    ? cn("font-bold", TEXT_ACTIVE[s.tone])
                    : "text-placeholder",
                )}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[13px] text-muted">
          این فقط یک راهنمای ساده است؛ تصمیم نهایی با شماست.
        </p>
      </div>
    </section>
  );
}
