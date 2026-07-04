import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinRow } from "./coin-row";
import { SectionHeader } from "./section-header";
import { FlameIcon } from "@/components/ui/icons";
import { formatMarketCap } from "@/lib/utils/money";

/** «پرطرفدارها» — the most popular coins, with market cap as the subtitle. */
export function TrendingList({ coins }: { coins: Coin[] }) {
  if (coins.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title="پرطرفدارها" icon={<FlameIcon size={18} />} />
      <ul className="flex flex-col divide-y divide-line">
        {coins.map((coin) => (
          <li key={coin.id}>
            <CoinRow
              coin={coin}
              subtitle={`ارزش بازار ${formatMarketCap(coin.marketCap)}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
