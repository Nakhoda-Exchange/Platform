import type { Portfolio } from "@/lib/core/domain/portfolio/portfolio";
import type { PortfolioHistory } from "@/lib/core/domain/portfolio/portfolio-history";
import { formatChangePercent, formatIrtShort } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/** «۱٬۲۳۴ ت (٪۵/۶)» — colour carries gain/loss; aria says it for screen readers. */
function SignedIrt({ amount, percent }: { amount: number; percent: number }) {
  const up = amount >= 0;
  return (
    <span
      dir="ltr"
      aria-label={`${up ? "سود" : "زیان"} ${formatIrtShort(Math.abs(amount))}، ${formatChangePercent(percent)}`}
      className={cn("font-bold", up ? "text-gain" : "text-loss")}
    >
      {formatIrtShort(Math.abs(amount))} ({formatChangePercent(percent)})
    </span>
  );
}

/**
 * All-time profit «سود کل» — a plain, non-interactive line under the total.
 *
 * V0: the tap-to-open details sheet (account-value history chart + دارایی
 * composition breakdown) is hidden for everyone, and the pill background is
 * dropped, so this is display-only. The `history` prop is kept in the contract
 * (and PortfolioHistoryChart kept on disk) so the sheet can return post-V0
 * without touching callers.
 */
export function PortfolioDetails({
  portfolio,
}: {
  portfolio: Portfolio;
  history: PortfolioHistory | null;
}) {
  return (
    <div className="flex items-center justify-center gap-2 text-[13px]">
      <span className="text-muted">سود کل</span>
      <SignedIrt
        amount={portfolio.profitIrt}
        percent={portfolio.profitPercent}
      />
    </div>
  );
}
