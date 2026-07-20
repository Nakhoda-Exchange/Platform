import { CoinHeaderClient } from "./coin-header-client";

/** The coin detail page's slot header. Client-rendered: it fetches the coin
 *  from /api/market/[symbol] in the browser (see coin-header-client.tsx). */
export default async function CoinHeaderSlot({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <CoinHeaderClient symbol={symbol} />;
}
