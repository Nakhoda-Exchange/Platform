"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Sheet } from "@/components/ui/sheet";
import {
  ChevronLeftIcon,
  ClockIcon,
  TrendingUpIcon,
  WalletIcon,
  type IconProps,
} from "@/components/ui/icons";
import { CoinIcon } from "@/components/market/coin-icon";
import type { Portfolio } from "@/lib/core/domain/portfolio/portfolio";
import type { PortfolioHistory } from "@/lib/core/domain/portfolio/portfolio-history";
import { formatChangePercent, formatIrtShort } from "@/lib/utils/money";
import { toPersianDigits } from "@/lib/utils/digits";
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
 * compact profit pill; tapping it opens a 90vh bottom sheet reporting how the
 * account is doing (history chart, all-time & today P&L) and how «دارایی کل» is
 * distributed across coins and cash — the concentration read the flat holdings
 * list can't give. The cash/coins totals themselves live on the home screen, so
 * they aren't repeated here.
 */
export function PortfolioDetails({
  portfolio,
  history,
}: {
  portfolio: Portfolio;
  history: PortfolioHistory | null;
}) {
  const [open, setOpen] = useState(false);

  const total = portfolio.totalIrt;
  // Everything the total is made of, biggest slice first, so the sheet reads as
  // "here's where your money sits". Cash is just another slice.
  const slices = [
    ...portfolio.holdings
      .filter((h) => h.valueIrt > 0)
      .map((h) => ({
        id: h.coin.id,
        coin: h.coin,
        label: h.coin.name,
        value: h.valueIrt,
      })),
    ...(portfolio.availableIrt > 0
      ? [
          {
            id: "cash",
            coin: null,
            label: "موجودی تومانی",
            value: portfolio.availableIrt,
          },
        ]
      : []),
  ].sort((a, b) => b.value - a.value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-[13px] transition-colors hover:bg-line"
      >
        <span className="text-muted">سود کل</span>
        <SignedIrt
          amount={portfolio.profitIrt}
          percent={portfolio.profitPercent}
        />
        <ChevronLeftIcon size={14} className="text-placeholder" />
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="جزئیات دارایی"
        panelClassName="h-[90vh]"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain">
          {history ? <PortfolioHistoryChart history={history} /> : null}

          {/* How the account is doing */}
          <dl className="flex flex-col rounded-card bg-surface px-4">
            <Row Icon={TrendingUpIcon} label="سود کل">
              <SignedIrt
                amount={portfolio.profitIrt}
                percent={portfolio.profitPercent}
              />
            </Row>
            <Row Icon={ClockIcon} label="امروز">
              <SignedIrt
                amount={portfolio.dayChangeIrt}
                percent={portfolio.dayChangePercent}
              />
            </Row>
          </dl>

          {/* Where the money sits */}
          {slices.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h3 className="text-[15px] font-bold text-ink">ترکیب دارایی</h3>
              {slices.map((s) => {
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    {s.coin ? (
                      <CoinIcon coin={s.coin} size={32} />
                    ) : (
                      <span className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <WalletIcon size={17} />
                      </span>
                    )}
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-bold text-ink">{s.label}</span>
                        <span dir="ltr" className="text-muted">
                          {formatIrtShort(s.value)}
                        </span>
                      </div>
                      <div
                        dir="ltr"
                        className="h-1.5 overflow-hidden rounded-full bg-line"
                      >
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span
                      dir="ltr"
                      className="w-9 shrink-0 text-left text-[13px] font-bold text-ink"
                    >
                      ٪{toPersianDigits(pct)}
                    </span>
                  </div>
                );
              })}
            </section>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
