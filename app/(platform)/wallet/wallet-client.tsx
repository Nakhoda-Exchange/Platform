"use client";

import Link from "next/link";
import type { Coin } from "@/lib/core/domain/market/coin";
import type { Portfolio } from "@/lib/core/domain/portfolio/portfolio";
import type { PortfolioHistory } from "@/lib/core/domain/portfolio/portfolio-history";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { HoldingListItem } from "@/components/portfolio/holding-list-item";
import { CashListItem } from "@/components/portfolio/cash-list-item";
import { PortfolioEmpty } from "@/components/portfolio/portfolio-empty";
import { LoadError } from "@/components/ui/load-error";
import { buttonClasses } from "@/components/ui/button";
import { useClientData } from "@/lib/client/use-client-data";
import WalletLoading from "./loading";

interface WalletVM {
  portfolio: Portfolio;
  history: PortfolioHistory | null;
  suggestions: Coin[];
}

/**
 * Client-rendered wallet (portfolio) screen. Data is fetched in the browser
 * from `/api/wallet/portfolio` (a server-side BFF that forwards the auth
 * token), so this route renders on the client while the fetch stays secure.
 */
export function WalletClient() {
  const { data, error, loading, reload } = useClientData<WalletVM>(
    "/api/wallet/portfolio",
  );

  if (loading) return <WalletLoading />;
  if (error || !data) {
    return (
      <LoadError message="بارگذاری دارایی‌ها ناموفق بود." onRetry={reload} />
    );
  }

  const { portfolio, history, suggestions } = data;

  // Only the truly-empty account (no coins, no cash, nothing pending) gets the
  // deposit-first screen. A user who deposited Toman but hasn't bought must
  // still see their money — otherwise the wallet reads as "you have nothing".
  const hasNothing =
    portfolio.holdings.length === 0 &&
    portfolio.availableIrt <= 0 &&
    portfolio.pendingWithdrawIrt <= 0;
  if (hasNothing) {
    return <PortfolioEmpty suggestions={suggestions} />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-6 pt-4">
      <PortfolioSummary portfolio={portfolio} history={history} />
      {/* Assets — Toman always leads (like a صراف), then the coins. Shows
          whenever there's cash or coins; a coins-empty wallet still gets the
          «buy your first coin» nudge below. */}
      {portfolio.holdings.length > 0 || portfolio.availableIrt > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-[17px] font-bold text-ink">دارایی‌های من</h2>
          <ul className="-mx-4 flex flex-col divide-y divide-line">
            {portfolio.availableIrt > 0 ? (
              <li>
                <CashListItem
                  availableIrt={portfolio.availableIrt}
                  withActions
                />
              </li>
            ) : null}
            {portfolio.holdings.map((holding) => (
              <li key={holding.coin.id}>
                <HoldingListItem holding={holding} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {portfolio.holdings.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-8 text-center">
          <p className="max-w-[280px] text-[15px] leading-[1.8] text-muted">
            هنوز رمزارزی نخریده‌ای. با اولین خرید، سبد دارایی‌ات این‌جا شکل
            می‌گیرد.
          </p>
          <Link href="/market" className={buttonClasses({ size: "lg" })}>
            خرید رمزارز
          </Link>
        </section>
      ) : null}
    </div>
  );
}
