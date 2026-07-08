import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { MarketScreen } from "@/components/market/market-screen";
import { LoadError } from "@/components/ui/load-error";

export const metadata: Metadata = {
  title: "بازار | ناخدا",
};

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  const [{ q, f }, result, portfolioResult] = await Promise.all([
    searchParams,
    container.resolve(TOKENS.GetMarketOverviewUseCase).execute(),
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
  ]);

  if (!result.ok) {
    return <LoadError message="بارگذاری بازار ناموفق بود." />;
  }

  // Coins the user holds: their rows swipe-right to SELL instead of details.
  const heldIds = portfolioResult.ok
    ? portfolioResult.data.holdings
        .filter((h) => h.amount > 0)
        .map((h) => h.coin.id)
    : [];
  // Spendable Toman, so shoppers see what they have to buy with.
  const availableIrt = portfolioResult.ok
    ? portfolioResult.data.availableIrt
    : 0;

  return (
    <MarketScreen
      overview={result.data}
      heldIds={heldIds}
      availableIrt={availableIrt}
      initialQuery={q ?? ""}
      initialFilter={f}
    />
  );
}
