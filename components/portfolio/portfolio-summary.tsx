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
import {
  formatChangePercent,
  formatIrt,
  formatIrtShort,
} from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

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

/** Total account value, today's P&L, and the icon quick actions. */
export function PortfolioSummary({ portfolio }: { portfolio: Portfolio }) {
  const up = portfolio.dayChangeIrt >= 0;
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[14px] text-muted">موجودی کل</span>
        <span className="text-[32px] font-extrabold text-ink">
          {formatIrt(portfolio.totalValueIrt)}
        </span>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1",
            up ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss",
          )}
        >
          <span className="text-[12px] font-medium">امروز</span>
          <span dir="ltr" className="text-[13px] font-bold">
            {up ? "▲" : "▼"} {formatIrtShort(Math.abs(portfolio.dayChangeIrt))}{" "}
            ({formatChangePercent(portfolio.dayChangePercent)})
          </span>
        </div>
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
