import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { CoinDetailScreen } from "@/components/market/coin-detail-screen";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} | ناخدا` };
}

export default async function CoinDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const [result, portfolioResult] = await Promise.all([
    container.resolve(TOKENS.GetCoinDetailUseCase).execute(symbol),
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
  ]);

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری اطلاعات رمزارز ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }
  if (!result.data) notFound();

  // Sell only makes sense when the user actually holds this coin.
  const coinId = result.data.coin.id;
  const canSell =
    portfolioResult.ok &&
    portfolioResult.data.holdings.some(
      (h) => h.coin.id === coinId && h.amount > 0,
    );

  return <CoinDetailScreen detail={result.data} canSell={canSell} />;
}
