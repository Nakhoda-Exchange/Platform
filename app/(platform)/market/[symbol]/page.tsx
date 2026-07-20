import type { Metadata } from "next";
import { CoinDetailClient } from "./coin-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} | ناخدا` };
}

// Client-rendered: data is fetched in the browser via /api/market/[symbol].
export default async function CoinDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <CoinDetailClient symbol={symbol} />;
}
