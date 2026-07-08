"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import type { UserProfile } from "@/lib/core/domain/account/profile";
import {
  BellIcon,
  ChevronLeftIcon,
  CreditCardIcon,
  GiftIcon,
  HeadphonesIcon,
  HelpCircleIcon,
  ShieldIcon,
  type IconProps,
} from "@/components/ui/icons";
import { openSupportChat } from "@/components/support/goftino";
import { ThemeSelector } from "./theme-row";
import { cn } from "@/lib/utils/cn";

/** One settings row: a brand-badged icon, label, trailing value + chevron. A
 *  row with neither `onClick` nor `href` renders static, never a dead link. */
function Row({
  Icon,
  label,
  value,
  valueClassName,
  onClick,
  href,
  highlight,
}: {
  Icon: ComponentType<IconProps>;
  label: string;
  value?: ReactNode;
  valueClassName?: string;
  onClick?: () => void;
  href?: string;
  /** Give this row extra weight — for the one item worth drawing the eye to. */
  highlight?: boolean;
}) {
  const inner = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-field bg-brand/10 text-brand"
        >
          <Icon size={18} />
        </span>
        <span
          className={cn(
            "truncate text-[15px]",
            highlight ? "font-extrabold text-brand" : "font-bold text-ink",
          )}
        >
          {label}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {value ? (
          <span className={cn("text-[13px] text-muted", valueClassName)}>
            {value}
          </span>
        ) : null}
        <ChevronLeftIcon size={18} className="text-placeholder" />
      </span>
    </>
  );
  const rowClass =
    "flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors hover:bg-line";
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rowClass}>
        {inner}
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {inner}
      </Link>
    );
  }
  return <div className={rowClass}>{inner}</div>;
}

/**
 * Account settings: one card of rows (security → account → activity → help, top
 * to bottom), then the theme control. A client leaf because the support row
 * opens the Goftino widget and the theme control is interactive.
 */
export function AccountMenu({ profile }: { profile: UserProfile }) {
  return (
    <nav aria-label="تنظیمات حساب" className="flex flex-col gap-4">
      <div className="flex flex-col divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        <Row
          Icon={ShieldIcon}
          label="ورود دومرحله‌ای"
          href="/account/two-step"
          value={profile.twoFactorEnabled ? "فعال" : "غیرفعال"}
          valueClassName={
            profile.twoFactorEnabled ? "font-bold text-brand" : undefined
          }
        />
        <Row
          Icon={CreditCardIcon}
          label="حساب‌های بانکی"
          href="/account/bank-accounts"
        />
        <Row Icon={BellIcon} label="اعلان‌ها" href="/account/announcements" />
        <Row
          Icon={GiftIcon}
          label="دعوت از دوستان"
          href="/account/referral"
          highlight
        />
        <Row Icon={HelpCircleIcon} label="سوالات متداول" href="/account/faq" />
        <Row Icon={HeadphonesIcon} label="پشتیبانی" onClick={openSupportChat} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="px-1 text-[12px] font-bold text-muted">حالت نمایش</h2>
        <ThemeSelector />
      </div>
    </nav>
  );
}
