import Link from "next/link";
import type { ComponentType } from "react";
import type { Portfolio } from "@/lib/core/domain/portfolio/portfolio";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ClockIcon,
  CoinsIcon,
  type IconProps,
} from "@/components/ui/icons";
import { PortfolioDetails } from "./portfolio-details";
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
export function PortfolioSummary({ portfolio }: { portfolio: Portfolio }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2">
        <span className="text-[14px] text-muted">دارایی کل</span>
        <span className="text-[32px] font-extrabold text-ink">
          {formatIrt(portfolio.totalIrt)}
        </span>
        <PortfolioDetails
          availableIrt={portfolio.availableIrt}
          holdingsValueIrt={portfolio.holdingsValueIrt}
          profitIrt={portfolio.profitIrt}
          profitPercent={portfolio.profitPercent}
          dayChangeIrt={portfolio.dayChangeIrt}
          dayChangePercent={portfolio.dayChangePercent}
          pendingWithdrawIrt={portfolio.pendingWithdrawIrt}
        />
      </div>

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
