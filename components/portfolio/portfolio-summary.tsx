import Link from "next/link";
import type { Portfolio } from "@/lib/core/domain/portfolio/portfolio";
import { PortfolioChart } from "./portfolio-chart";
import { buttonClasses } from "@/components/ui/button";
import {
  formatChangePercent,
  formatIrt,
  formatIrtShort,
} from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/** Total account value, today's P&L, a trend chart, and deposit/withdraw actions. */
export function PortfolioSummary({ portfolio }: { portfolio: Portfolio }) {
  const up = portfolio.dayChangeIrt >= 0;
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[14px] text-muted">موجودی کل</span>
        <span className="text-[32px] font-extrabold text-ink">
          {formatIrt(portfolio.totalValueIrt)}
        </span>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1",
            up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
          )}
        >
          <span className="text-[12px] font-medium">امروز</span>
          <span dir="ltr" className="text-[13px] font-bold">
            {up ? "▲" : "▼"} {formatIrtShort(Math.abs(portfolio.dayChangeIrt))}{" "}
            ({formatChangePercent(portfolio.dayChangePercent)})
          </span>
        </div>
      </div>

      <PortfolioChart />

      {/* 2×2 grid: four xl buttons in one flex row overflow a 390px viewport
          (px-6 + whitespace-nowrap can't shrink). lg keeps ≥44px targets. */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/wallet/deposit"
          className={buttonClasses({ size: "lg", fullWidth: true })}
        >
          واریز
        </Link>
        <Link
          href="#"
          className={buttonClasses({
            variant: "ghost",
            size: "lg",
            fullWidth: true,
            className: "bg-surface",
          })}
        >
          برداشت
        </Link>
        <Link
          href="#"
          className={buttonClasses({
            variant: "ghost",
            size: "lg",
            fullWidth: true,
            className: "bg-surface",
          })}
        >
          خرید/فروش
        </Link>
        <Link
          href="/wallet/history"
          className={buttonClasses({
            variant: "ghost",
            size: "lg",
            fullWidth: true,
            className: "bg-surface",
          })}
        >
          تاریخچه
        </Link>
      </div>
    </section>
  );
}
