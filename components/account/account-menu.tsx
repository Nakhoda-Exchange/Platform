"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import type { UserProfile } from "@/lib/core/domain/account/profile";
import {
  BellIcon,
  ChevronLeftIcon,
  CreditCardIcon,
  FileTextIcon,
  GiftIcon,
  HeadphonesIcon,
  ShieldIcon,
  type IconProps,
} from "@/components/ui/icons";
import { openSupportChat } from "@/components/support/goftino";
import { ThemeRow } from "./theme-row";
import { cn } from "@/lib/utils/cn";

/** One settings row: leading icon, label, trailing value + RTL-forward chevron. */
function Row({
  Icon,
  label,
  value,
  valueClassName,
  onClick,
  href,
}: {
  Icon: ComponentType<IconProps>;
  label: string;
  value?: ReactNode;
  valueClassName?: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <span className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-field bg-surface text-muted"
        >
          <Icon size={20} />
        </span>
        <span className="text-[15px] font-bold text-ink">{label}</span>
      </span>
      <span className="flex items-center gap-1.5">
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
    "flex w-full items-center justify-between gap-3 py-3 text-right transition-colors hover:bg-surface";
  // A row is either an action (onClick) or a link (href). With neither it
  // renders as a static row, never a dead `#` link.
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
 * The account settings list. A client leaf only because the support row opens
 * the Goftino widget; every other row navigates to its settings screen.
 */
export function AccountMenu({ profile }: { profile: UserProfile }) {
  return (
    <nav aria-label="تنظیمات حساب">
      <ul className="flex flex-col divide-y divide-line">
        <li>
          <Row
            Icon={ShieldIcon}
            label="ورود دومرحله‌ای"
            href="/account/two-step"
            value={profile.twoFactorEnabled ? "فعال" : "غیرفعال"}
            valueClassName={
              profile.twoFactorEnabled ? "font-bold text-brand" : undefined
            }
          />
        </li>
        <li>
          <Row
            Icon={CreditCardIcon}
            label="حساب‌های بانکی"
            href="/account/bank-accounts"
          />
        </li>
        <li>
          <ThemeRow />
        </li>
        <li>
          <Row
            Icon={GiftIcon}
            label="دعوت از دوستان"
            href="/account/referral"
          />
        </li>
        <li>
          <Row Icon={BellIcon} label="اعلان‌ها" href="/account/announcements" />
        </li>
        <li>
          <Row
            Icon={HeadphonesIcon}
            label="پشتیبانی"
            onClick={openSupportChat}
          />
        </li>
        <li>
          <Row
            Icon={FileTextIcon}
            label="قوانین و حریم خصوصی"
            href="/account/terms"
          />
        </li>
      </ul>
    </nav>
  );
}
