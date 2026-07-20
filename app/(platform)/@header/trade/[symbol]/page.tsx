import { TradeHeaderClient } from "./trade-header-client";

/** The trade screen's slot header. Client-rendered: it fetches the coin from
 *  /api/trade/[symbol] in the browser (see trade-header-client.tsx). */
export default async function TradeHeaderSlot({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <TradeHeaderClient symbol={symbol} />;
}
