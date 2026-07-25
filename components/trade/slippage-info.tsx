"use client";

import { useState } from "react";
import { hasMeaningfulSlippage } from "@/lib/core/domain/trade/quote";
import { formatSlippagePercent } from "@/lib/utils/money";
import { InfoIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * How the expected slippage reads to the user. A route with no meaningful price
 * impact — the exchange's own inventory, or a CEX quote inside its window — is
 * said in words rather than as «٪۰», which looks like a missing number.
 * `null` (not determined) has no text at all: the caller shows nothing.
 */
export function slippageLabel(bps: number | null): string | null {
  if (bps === null) return null;
  return hasMeaningfulSlippage(bps) ? formatSlippagePercent(bps) : "بدون لغزش";
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
        <p>
          «بدون لغزش» یعنی سفارش شما با قیمت قطعی انجام می‌شود و بازار را
          جابه‌جا نمی‌کند. این عدد جدا از «کارمزد» است؛ کارمزد به‌صورت مجزا در
          تأیید سفارش نمایش داده می‌شود.
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
