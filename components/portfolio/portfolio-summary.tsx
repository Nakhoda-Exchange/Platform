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
import { buttonClasses } from "@/components/ui/button";
import { PortfolioDetails } from "./portfolio-details";
import { CashBalanceCard } from "./cash-balance-card";
import { formatIrt } from "@/lib/utils/money";

type Action = {
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
};

const DEPOSIT: Action = {
  href: "/wallet/deposit",
  label: "واریز",
  Icon: ArrowDownIcon,
};
const WITHDRAW: Action = {
  href: "/wallet/withdraw",
  label: "برداشت",
  Icon: ArrowUpIcon,
};
const BUY: Action = { href: "/market", label: "خرید/فروش", Icon: CoinsIcon };
const HISTORY: Action = {
  href: "/wallet/history",
  label: "تاریخچه",
  Icon: ClockIcon,
};

/** One Moonshot-style quick action: circle icon + short label. */
function ActionIcon({ href, label, Icon }: Action) {
  return (
    <Link href={href} className="group flex w-16 flex-col items-center gap-2">
      <span className="flex size-13 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors group-hover:bg-brand/15">
        <Icon size={22} />
      </span>
      <span className="text-[12px] font-bold text-ink">{label}</span>
    </Link>
  );
}

/**
 * The wallet-home summary: the total (cash + coins), the cash/coins breakdown
 * so the total reads as a sum, a compact profit pill that opens the details
 * sheet, and the quick actions.
 *
 * With no spendable Toman there's nothing to withdraw, so برداشت drops and واریز
 * becomes a full-width CTA — the one thing that unblocks buying is depositing.
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
  const hasCash = portfolio.availableIrt > 0;

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

      {/* Cash + coins that make up the total, once coins are in the mix. */}
      {!allCash ? (
        <CashBalanceCard
          availableIrt={portfolio.availableIrt}
          holdingsValueIrt={portfolio.holdingsValueIrt}
          pendingWithdrawIrt={portfolio.pendingWithdrawIrt}
        />
      ) : null}

      {hasCash ? (
        <nav
          aria-label="عملیات کیف پول"
          className="flex items-start justify-between px-2"
        >
          {[DEPOSIT, WITHDRAW, BUY, HISTORY].map((a) => (
            <ActionIcon key={a.href} {...a} />
          ))}
        </nav>
      ) : (
        <div className="flex flex-col gap-4">
          <Link
            href="/wallet/deposit"
            className={buttonClasses({ size: "xl", fullWidth: true })}
          >
            واریز تومان
          </Link>
          <nav
            aria-label="عملیات کیف پول"
            className="flex items-start justify-center gap-12"
          >
            {[BUY, HISTORY].map((a) => (
              <ActionIcon key={a.href} {...a} />
            ))}
          </nav>
        </div>
      )}
    </section>
  );
}
