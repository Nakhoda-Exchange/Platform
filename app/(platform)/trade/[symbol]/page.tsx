import type { Metadata } from "next";
import { TradeClient } from "./trade-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `خرید و فروش ${symbol.toUpperCase()} | ناخدا` };
}

// Client-rendered: data is fetched in the browser via /api/trade/[symbol].
export default async function TradePage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <TradeClient symbol={symbol} />;
}
