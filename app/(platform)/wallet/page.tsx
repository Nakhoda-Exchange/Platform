import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { HoldingListItem } from "@/components/portfolio/holding-list-item";
import { PortfolioEmpty } from "@/components/portfolio/portfolio-empty";
import { TradePendingToast } from "@/components/portfolio/trade-pending-toast";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "دارایی | ناخدا",
};

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ traded?: string }>;
}) {
  const [{ traded }, result, historyResult] = await Promise.all([
    searchParams,
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
    container.resolve(TOKENS.GetPortfolioHistoryUseCase).execute(),
  ]);

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری دارایی‌ها ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }

  const portfolio = result.data;
  // Only the truly-empty account (no coins, no cash, nothing pending) gets the
  // deposit-first screen. A user who deposited Toman but hasn't bought must
  // still see their money — otherwise the wallet reads as "you have nothing".
  const hasNothing =
    portfolio.holdings.length === 0 &&
    portfolio.availableIrt <= 0 &&
    portfolio.pendingWithdrawIrt <= 0;
  if (hasNothing) {
    return <PortfolioEmpty />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-6 pt-4">
      {traded ? <TradePendingToast /> : null}
      <PortfolioSummary
        portfolio={portfolio}
        history={historyResult.ok ? historyResult.data : null}
      />
      {portfolio.holdings.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-[17px] font-bold text-ink">دارایی‌های من</h2>
          <ul className="-mx-4 flex flex-col divide-y divide-line">
            {portfolio.holdings.map((holding) => (
              <li key={holding.coin.id}>
                <HoldingListItem holding={holding} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-8 text-center">
          <p className="max-w-[280px] text-[15px] leading-[1.8] text-muted">
            هنوز رمزارزی نخریده‌ای. با اولین خرید، سبد دارایی‌ات این‌جا شکل
            می‌گیرد.
          </p>
          <Link href="/market" className={buttonClasses({ size: "lg" })}>
            خرید رمزارز
          </Link>
        </section>
      )}
    </div>
  );
}
