import type { IndicatorSummary } from "@/lib/core/domain/market/indicator-summary";
import { toPersianDigits } from "@/lib/utils/digits";
import { cn } from "@/lib/utils/cn";

const VERDICTS: Record<
  IndicatorSummary["verdict"],
  { label: string; tone: string; aria: string }
> = {
  buy: {
    label: "خرید",
    tone: "text-gain",
    aria: "بیشتر نشانه‌ها رو به بالاست؛ نزدیک به سمت خرید.",
  },
  hold: {
    label: "نگه‌داری",
    tone: "text-ink",
    aria: "بازار هنوز تصمیمش را نگرفته؛ میانه‌ی خط.",
  },
  sell: {
    label: "فروش",
    tone: "text-loss",
    aria: "بیشتر نشانه‌ها رو به پایین است؛ نزدیک به سمت فروش.",
  },
};

/**
 * «راهنمای معامله» — one glance, no reading: a red→green strength line
 * (far LEFT = strong sell, far RIGHT = strong buy) with a needle showing
 * where this coin's simple signals land. The verdict word + signal count
 * sit under the needle for anyone who wants it in words, and an honest
 * «تصمیم با شماست» line closes the card. Colors echo the words, never
 * replace them.
 */
export function IndicatorSummaryCard({
  summary,
}: {
  summary: IndicatorSummary;
}) {
  if (summary.total === 0) return null; // not enough data — say nothing

  const { verdict, positives, total } = summary;
  const v = VERDICTS[verdict];
  // 0% = strong sell … 100% = strong buy; clamped so the needle never clips.
  const position = Math.min(96, Math.max(4, (positives / total) * 100));

  return (
    <section aria-label="راهنمای معامله" className="flex flex-col gap-2">
      <h2 className="text-[16px] font-bold text-ink">راهنمای معامله</h2>
      <div className="flex flex-col gap-3 rounded-card bg-surface p-4">
        {/* The strength line: sell-red on the left → buy-green on the right. */}
        <div dir="ltr" role="img" aria-label={v.aria} className="relative pt-1">
          <div className="h-2 rounded-full bg-gradient-to-r from-loss via-line to-gain" />
          <span
            aria-hidden
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/4 rounded-full border-[3px] border-paper bg-ink shadow-sm"
            style={{ left: `${position}%` }}
          />
        </div>
        <div className="flex items-baseline justify-between text-[14px] font-bold">
          <span className="text-gain">خرید</span>
          <span className={cn("text-[15px]", v.tone)}>
            {v.label}{" "}
            <span className="text-[12px] font-medium text-muted">
              ({toPersianDigits(positives)} از {toPersianDigits(total)} نشانه
              مثبت)
            </span>
          </span>
          <span className="text-loss">فروش</span>
        </div>

        <p className="text-[13px] text-muted">
          این فقط یک راهنمای ساده است؛ تصمیم نهایی با شماست.
        </p>
      </div>
    </section>
  );
}
