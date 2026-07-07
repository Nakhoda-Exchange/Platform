import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { TradeScreen } from "@/components/trade/trade-screen";
import { LoadError } from "@/components/ui/load-error";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `خرید و فروش ${symbol.toUpperCase()} | ناخدا` };
}

export default async function TradePage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ side?: string }>;
}) {
  const [{ symbol }, { side }] = await Promise.all([params, searchParams]);

  const result = await container
    .resolve(TOKENS.GetTradeContextUseCase)
    .execute(symbol);

  if (!result.ok) {
    return (
      <LoadError
        message="بارگذاری اطلاعات معامله ناموفق بود."
        action={{ label: "بازگشت به بازار", href: "/market" }}
      />
    );
  }
  if (!result.data) notFound();

  return (
    <TradeScreen
      context={result.data}
      initialSide={side === "sell" ? "sell" : "buy"}
    />
  );
}
