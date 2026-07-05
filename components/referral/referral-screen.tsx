"use client";

import { useState } from "react";
import type { ReferralOverview } from "@/lib/core/domain/referral/referral";
import { Button } from "@/components/ui/button";
import { GiftIcon } from "@/components/ui/icons";
import { toPersianDigits } from "@/lib/utils/digits";
import { formatIrtShort } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

const HOW_IT_WORKS = [
  "کدت را برای دوستت بفرست.",
  "دوستت با کد تو ثبت‌نام و احراز هویت می‌کند.",
  "از کارمزد هر معامله او سهم می‌گیری — تا ۱۲ ماه.",
];

/**
 * «کد دعوت ناخدا»: the code + share, earnings, the fee-share tier and the
 * road to the next one, and three plain steps. Rewards land in the wallet
 * and show as «پاداش دعوت» in the history.
 */
export function ReferralScreen({ overview }: { overview: ReferralOverview }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = () =>
    `${window.location.origin}/login?ref=${encodeURIComponent(overview.code)}`;

  const share = async () => {
    const text = `با کد دعوت من در ناخدا ثبت‌نام کن و با کارمزد کمتر معامله کن: ${overview.code}\n${shareUrl()}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "کد دعوت ناخدا", text });
        return;
      }
      throw new Error("no-share");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* clipboard unavailable — the code stays selectable */
      }
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(overview.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* selectable fallback */
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* The code */}
      <div className="flex flex-col items-center gap-3 rounded-card bg-brand/5 p-5">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand"
        >
          <GiftIcon size={24} />
        </span>
        <span className="text-[13px] text-muted">کد دعوت شما</span>
        <button
          type="button"
          onClick={copyCode}
          dir="ltr"
          className="text-[28px] font-extrabold tracking-widest text-brand select-all"
        >
          {overview.code}
        </button>
        <Button type="button" size="lg" fullWidth onClick={share}>
          {copied ? "کپی شد ✓" : "ارسال کد دعوت"}
        </Button>
      </div>

      {/* Earnings + tier */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-card bg-surface p-4">
        <div className="flex flex-col gap-1">
          <dt className="text-[12px] text-muted">درآمد شما از دعوت‌ها</dt>
          <dd className="text-[14px] font-bold text-gain">
            {formatIrtShort(overview.earnedIrt)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-[12px] text-muted">دوستان فعال</dt>
          <dd className="text-[14px] font-bold text-ink">
            {toPersianDigits(overview.activeCount)} از{" "}
            {toPersianDigits(overview.invitedCount)} دعوت
          </dd>
        </div>
        <div className="col-span-2 flex flex-col gap-2 border-t border-line pt-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted">
              سهم شما از کارمزد دوستان:{" "}
              <span className="font-bold text-brand">
                ٪{toPersianDigits(overview.sharePercent)}
              </span>
            </span>
            {overview.nextTier ? (
              <span className="text-muted">
                با {toPersianDigits(overview.nextTier.minActive)} دوست فعال: ٪
                {toPersianDigits(overview.nextTier.sharePercent)}
              </span>
            ) : (
              <span className="font-bold text-brand">بالاترین سطح ✓</span>
            )}
          </div>
          {overview.nextTier ? (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand"
                style={{
                  width: `${Math.min(
                    100,
                    (overview.activeCount / overview.nextTier.minActive) * 100,
                  )}%`,
                }}
              />
            </div>
          ) : null}
        </div>
      </dl>

      {/* How it works */}
      <ol className="flex flex-col gap-3">
        {HOW_IT_WORKS.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                "bg-brand/10 text-[12px] font-bold text-brand",
              )}
            >
              {toPersianDigits(i + 1)}
            </span>
            <span className="text-[15px] leading-7 text-ink">{step}</span>
          </li>
        ))}
      </ol>

      <p className="text-[13px] leading-6 text-muted">
        پاداش‌ها به‌صورت خودکار به کیف پول شما واریز می‌شوند و در «تاریخچه» با
        عنوان «پاداش دعوت» دیده می‌شوند.
      </p>
    </div>
  );
}
