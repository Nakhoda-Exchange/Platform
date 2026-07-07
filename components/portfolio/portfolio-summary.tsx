import Link from "next/link";
import type { ComponentType } from "react";
import type { Portfolio } from "@/lib/core/domain/portfolio/portfolio";
import type { PortfolioHistory } from "@/lib/core/domain/portfolio/portfolio-history";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ClockIcon,
  CoinsIcon,
  type IconProps,
} from "@/components/ui/icons";
import { PortfolioDetails } from "./portfolio-details";
import { CashBalanceCard } from "./cash-balance-card";
import { formatIrt } from "@/lib/utils/money";

const ACTIONS: {
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
}[] = [
  { href: "/wallet/deposit", label: "واریز", Icon: ArrowDownIcon },
  { href: "/wallet/withdraw", label: "برداشت", Icon: ArrowUpIcon },
  { href: "/market", label: "خرید/فروش", Icon: CoinsIcon },
  { href: "/wallet/history", label: "تاریخچه", Icon: ClockIcon },
];

/**
 * The wallet-home summary, kept minimal: the total (cash + coins), ONE
 * compact profit pill that opens the 90vh details sheet (cash/holdings/
 * profit/today/pending breakdown), and the icon quick actions.
 */
export function PortfolioSummary({
  portfolio,
  history,
}: {
  portfolio: Portfolio;
  history: PortfolioHistory | null;
}) {
  // With no coins, «دارایی کل» IS the cash balance — so the hero becomes the
  // Toman balance itself (and the separate cash line/profit breakdown, which
  // only mean something once there are holdings, drop away).
  const allCash = portfolio.holdingsValueIrt <= 0;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2">
        <span className="text-[14px] text-muted">
          {allCash ? "موجودی تومانی" : "دارایی کل"}
        </span>
        <span className="text-[32px] font-extrabold text-ink">
          {formatIrt(portfolio.totalIrt)}
        </span>
        {allCash ? (
          portfolio.pendingWithdrawIrt > 0 ? (
            <span className="text-[13px] text-placeholder">
              {formatIrt(portfolio.pendingWithdrawIrt)} در حال برداشت
            </span>
          ) : null
        ) : (
          <PortfolioDetails
            availableIrt={portfolio.availableIrt}
            holdingsValueIrt={portfolio.holdingsValueIrt}
            profitIrt={portfolio.profitIrt}
            profitPercent={portfolio.profitPercent}
            dayChangeIrt={portfolio.dayChangeIrt}
            dayChangePercent={portfolio.dayChangePercent}
            pendingWithdrawIrt={portfolio.pendingWithdrawIrt}
            history={history}
          />
        )}
      </div>

      {/* Spendable Toman, broken out from the total once coins are in the mix. */}
      {!allCash ? (
        <CashBalanceCard
          availableIrt={portfolio.availableIrt}
          pendingWithdrawIrt={portfolio.pendingWithdrawIrt}
        />
      ) : null}

      {/* Icon quick actions (Moonshot-style): circle icon + short label. */}
      <nav
        aria-label="عملیات کیف پول"
        className="flex items-start justify-between px-2"
      >
        {ACTIONS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex w-16 flex-col items-center gap-2"
          >
            <span className="flex size-13 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors group-hover:bg-brand/15">
              <Icon size={22} />
            </span>
            <span className="text-[12px] font-bold text-ink">{label}</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
