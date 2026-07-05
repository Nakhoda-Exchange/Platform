"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Sheet } from "@/components/ui/sheet";
import {
  ArrowUpIcon,
  ChevronLeftIcon,
  ClockIcon,
  CoinsIcon,
  TrendingUpIcon,
  WalletIcon,
  type IconProps,
} from "@/components/ui/icons";
import type { PortfolioHistory } from "@/lib/core/domain/portfolio/portfolio-history";
import { formatChangePercent, formatIrtShort } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

// echarts only downloads on first sheet open, not with the wallet page.
// The fallback is a plain empty card, sized like the real one (300px,
// measured in WebKit) so the chart swaps in with zero layout jump.
const PortfolioHistoryChart = dynamic(
  () =>
    import("./portfolio-history-chart").then((m) => m.PortfolioHistoryChart),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden className="h-[300px] rounded-card bg-surface" />
    ),
  },
);

/** «▲ +۱٬۲۳۴ ت (٪۵/۶)» gain/loss colored — sign and words, never color alone. */
function SignedIrt({ amount, percent }: { amount: number; percent: number }) {
  const up = amount >= 0;
  return (
    <span dir="ltr" className={cn("font-bold", up ? "text-gain" : "text-loss")}>
      {up ? "▲ +" : "▼ −"}
      {formatIrtShort(Math.abs(amount))} ({formatChangePercent(percent)})
    </span>
  );
}

function Row({
  Icon,
  label,
  children,
}: {
  Icon: ComponentType<IconProps>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3.5 last:border-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon size={18} />
      </span>
      <dt className="flex-1 text-[15px] text-muted">{label}</dt>
      <dd className="text-[15px] font-bold text-ink">{children}</dd>
    </div>
  );
}

/**
 * The trader detail lives OFF the main screen: the wallet home shows one
 * compact profit pill; tapping it opens a 90vh bottom sheet with the full
 * breakdown (cash, holdings value, all-time profit, today, pending
 * withdrawals).
 */
export function PortfolioDetails({
  availableIrt,
  holdingsValueIrt,
  profitIrt,
  profitPercent,
  dayChangeIrt,
  dayChangePercent,
  pendingWithdrawIrt,
  history,
}: {
  availableIrt: number;
  holdingsValueIrt: number;
  profitIrt: number;
  profitPercent: number;
  dayChangeIrt: number;
  dayChangePercent: number;
  pendingWithdrawIrt: number;
  history: PortfolioHistory | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-[13px] transition-colors hover:bg-line"
      >
        <span className="text-muted">سود کل</span>
        <SignedIrt amount={profitIrt} percent={profitPercent} />
        <ChevronLeftIcon size={14} className="text-placeholder" />
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="جزئیات دارایی"
        panelClassName="h-[90vh]"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain">
          {history ? <PortfolioHistoryChart history={history} /> : null}
          <dl className="flex flex-col rounded-card bg-surface px-4">
            <Row Icon={WalletIcon} label="موجودی تومانی">
              {formatIrtShort(availableIrt)}
            </Row>
            <Row Icon={CoinsIcon} label="ارزش رمزارزها">
              {formatIrtShort(holdingsValueIrt)}
            </Row>
            <Row Icon={TrendingUpIcon} label="سود کل">
              <SignedIrt amount={profitIrt} percent={profitPercent} />
            </Row>
            <Row Icon={ClockIcon} label="امروز">
              <SignedIrt amount={dayChangeIrt} percent={dayChangePercent} />
            </Row>
            {pendingWithdrawIrt > 0 ? (
              <Row Icon={ArrowUpIcon} label="برداشت در انتظار">
                <span className="text-brand">
                  {formatIrtShort(pendingWithdrawIrt)}
                </span>
              </Row>
            ) : null}
          </dl>
        </div>
      </Sheet>
    </>
  );
}
