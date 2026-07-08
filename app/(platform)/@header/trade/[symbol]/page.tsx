import Link from "next/link";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { HeaderBar } from "@/components/layout/header-bar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { CoinIcon } from "@/components/market/coin-icon";

/**
 * The trade screen's slot header: back to the coin's page + coin identity,
 * and nothing else. No notification/support actions here — placing an order is
 * a focused task, so the bar stays quiet to avoid distraction.
 */
export default async function TradeHeaderSlot({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const result = await container
    .resolve(TOKENS.GetTradeContextUseCase)
    .execute(symbol);
  const coin = result.ok && result.data ? result.data.coin : null;

  return (
    <HeaderBar
      start={
        <>
          <Link
            href={coin ? `/market/${coin.symbol.toLowerCase()}` : "/market"}
            aria-label="بازگشت"
            className="flex size-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface"
          >
            <ArrowRightIcon size={24} />
          </Link>
          {coin ? (
            <div className="flex items-center gap-2.5">
              <CoinIcon coin={coin} size={36} />
              <div className="flex flex-col">
                <span className="text-[15px] font-extrabold leading-tight text-ink">
                  {coin.name}
                </span>
                <span className="text-[12px] text-muted">{coin.symbol}</span>
              </div>
            </div>
          ) : (
            <h1 className="text-[18px] font-extrabold text-ink">معامله</h1>
          )}
        </>
      }
      end={null}
    />
  );
}
