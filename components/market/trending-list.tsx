import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinRow } from "./coin-row";
import { SectionHeader } from "./section-header";
import { FlameIcon } from "@/components/ui/icons";

/** «پرطرفدارها» — the most popular coins, with market cap as the subtitle. */
export function TrendingList({
  coins,
  heldSymbols,
}: {
  coins: Coin[];
  heldSymbols: string[];
}) {
  if (coins.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title="پرطرفدارها" icon={<FlameIcon size={18} />} />
      <ul className="-mx-4 flex flex-col divide-y divide-line">
        {coins.map((coin) => (
          <li key={coin.id}>
            <CoinRow
              coin={coin}
              canSell={heldSymbols.includes(coin.symbol.toUpperCase())}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
