import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { CoinDetailScreen } from "@/components/market/coin-detail-screen";
import { LoadError } from "@/components/ui/load-error";

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
      <LoadError
        message="بارگذاری اطلاعات رمزارز ناموفق بود."
        action={{ label: "بازگشت به بازار", href: "/market" }}
      />
    );
  }
  if (!result.data) notFound();
  const detail = result.data;

  // The viewer's position in this coin (if any) → holding card + «فروش» action.
  const held = portfolioResult.ok
    ? portfolioResult.data.holdings.find(
        (h) => h.coin.id === detail.coin.id && h.amount > 0,
      )
    : undefined;
  const holding = held
    ? { amount: held.amount, valueIrt: held.valueIrt, costIrt: held.costIrt }
    : undefined;

  return <CoinDetailScreen detail={detail} holding={holding} />;
}
