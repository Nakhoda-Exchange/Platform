"use client";

import { useState } from "react";
import { formatSlippagePercent } from "@/lib/utils/money";
import { InfoIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * Floor for the slippage shown to the user, in basis points (0.1%).
 *
 * A firm-price route genuinely has no price impact, but quoting «بدون لغزش» or
 * «٪۰» reads as a promise the fill cannot make — the figure is an estimate, and
 * the order's price band is what actually bounds it. Stating a small honest
 * minimum is the conservative direction to round: it never under-promises.
 */
const MIN_DISPLAYED_SLIPPAGE_BPS = 10;

/**
 * How the expected slippage reads to the user. Always a percentage, never words
 * and never zero — anything at or below the floor is stated as «٪۰٫۱».
 * `null` (not determined) has no text at all: the caller decides what to show.
 */
export function slippageLabel(bps: number | null): string | null {
  if (bps === null) return null;
  return formatSlippagePercent(Math.max(bps, MIN_DISPLAYED_SLIPPAGE_BPS));
}

/** The plain-Persian explainer behind every ⓘ on this screen. */
function SlippageSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="لغزش قیمت چیست؟">
      <div className="flex flex-col gap-3 text-[15px] leading-7 text-muted">
        <p>
          «لغزش» اختلاف میان قیمتی است که می‌بینید و قیمتی که سفارش شما واقعاً
          با آن انجام می‌شود. هر سفارش، بسته به اندازه‌اش، بازار را کمی جابه‌جا
          می‌کند؛ هرچه سفارش بزرگ‌تر و بازار آن رمزارز کم‌عمق‌تر باشد، این
          اختلاف بیشتر است.
        </p>
        <p>
          عددی که نشان می‌دهیم یک{" "}
          <span className="font-bold text-ink">تخمین</span> بر پایهٔ نقدینگی
          همین لحظه و مقدار سفارش شماست، نه یک تضمین — با تغییر مقدار سفارش، این
          عدد هم تغییر می‌کند.
        </p>
        {/* This paragraph used to describe a «بدون لغزش» label that
            MIN_DISPLAYED_SLIPPAGE_BPS makes unreachable — the explainer promised
            a state the screen can never show. It now explains the floor itself. */}
        <p>
          کمترین عددی که نمایش می‌دهیم ٪۰٫۱ است: حتی وقتی مسیر سفارش قیمت قطعی
          دارد، به‌جای «صفر» همین عدد را می‌بینید — چون این رقم یک تخمین است و
          «صفر» شبیه تضمین به‌نظر می‌رسد. این عدد جدا از «کارمزد» است؛ کارمزد
          به‌صورت مجزا در تأیید سفارش نمایش داده می‌شود.
        </p>
      </div>
      <Button type="button" size="lg" fullWidth onClick={onClose}>
        متوجه شدم
      </Button>
    </Sheet>
  );
}

/**
 * The expected-slippage chip under the live price, with an ⓘ that opens the
 * explainer. The line stays mounted (reserved height) so a figure arriving or
 * clearing never shifts the amount below it.
 *
 * Shows nothing when the slippage is unknown (`null`) — we would rather say
 * nothing than imply a number we don't have.
 */
export function SlippageChip({ bps }: { bps: number | null }) {
  const [explaining, setExplaining] = useState(false);
  const label = slippageLabel(bps);

  return (
    <div className="flex min-h-6 items-center justify-center">
      {label ? (
        <button
          type="button"
          onClick={() => setExplaining(true)}
          aria-label={`لغزش تخمینی ${label}؛ توضیح بیشتر`}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[13px] text-muted transition-colors hover:text-ink"
        >
          <span>
            لغزش تخمینی <span className="font-bold text-ink">{label}</span>
          </span>
          <InfoIcon size={14} />
        </button>
      ) : null}
      <SlippageSheet open={explaining} onClose={() => setExplaining(false)} />
    </div>
  );
}

/**
 * The ⓘ next to the slippage row on the confirm sheet. Same explainer, sized to
 * sit inline with a `dt` label.
 */
export function SlippageInfoButton() {
  const [explaining, setExplaining] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setExplaining(true)}
        aria-label="لغزش قیمت چیست؟"
        className="inline-flex items-center text-muted transition-colors hover:text-ink"
      >
        <InfoIcon size={15} />
      </button>
      <SlippageSheet open={explaining} onClose={() => setExplaining(false)} />
    </>
  );
}
