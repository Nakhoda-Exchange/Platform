"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SwipeActions } from "@/components/ui/swipe-actions";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/ui/icons";
import { formatIrtShort } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/**
 * The Toman balance card, shared by the wallet «دارایی‌های من» list and the
 * market strip so the two never diverge: cash sits alongside the coins like on
 * an exchange (صراف). Taps through to deposit. `className` supplies the
 * container look per context (wallet = a plain list row, market = a card).
 * With `withActions`, the wallet row swipes for واریز / برداشت — Toman's
 * quick-actions, mirroring the coins' buy/sell swipe.
 */
export function CashListItem({
  availableIrt,
  className,
  withActions,
}: {
  availableIrt: number;
  className?: string;
  withActions?: boolean;
}) {
  const router = useRouter();

  const row = (
    <Link
      href="/wallet/deposit"
      draggable={false}
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
        className ?? "hover:bg-surface",
      )}
    >
      {/* Identity */}
      <div className="flex items-center gap-3">
        <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-brand text-[18px] font-extrabold text-white">
          ت
        </span>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-ink">تومان</span>
          <span className="text-[12px] text-muted">موجودی</span>
        </div>
      </div>

      {/* Balance */}
      <div className="flex flex-col items-start gap-0.5" dir="ltr">
        <span className="text-[14px] font-bold text-ink">
          {formatIrtShort(availableIrt)}
        </span>
      </div>
    </Link>
  );

  if (!withActions) return row;

  return (
    <SwipeActions
      left={{
        label: "واریز",
        Icon: ArrowDownIcon,
        tone: "brand",
        onCommit: () => router.push("/wallet/deposit"),
      }}
      right={{
        label: "برداشت",
        Icon: ArrowUpIcon,
        tone: "brand",
        onCommit: () => router.push("/wallet/withdraw"),
      }}
    >
      {row}
    </SwipeActions>
  );
}
