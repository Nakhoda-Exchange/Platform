import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { MarketScreen } from "@/components/market/market-screen";

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
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری بازار ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }

  // Coins the user holds: their rows swipe-left to SELL instead of details.
  const heldIds = portfolioResult.ok
    ? portfolioResult.data.holdings
        .filter((h) => h.amount > 0)
        .map((h) => h.coin.id)
    : [];

  return (
    <MarketScreen
      overview={result.data}
      heldIds={heldIds}
      initialQuery={q ?? ""}
      initialFilter={f}
    />
  );
}
