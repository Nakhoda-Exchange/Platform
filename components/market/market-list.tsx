import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinListItem } from "./coin-list-item";

/** The market coin list (PLP). Renders an empty state when there are no coins. */
export function MarketList({ coins }: { coins: Coin[] }) {
  if (coins.length === 0) {
    return (
      <p className="py-12 text-center text-[15px] text-muted">
        فعلاً رمزارزی برای نمایش نیست.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {coins.map((coin) => (
        <li key={coin.id}>
          <CoinListItem coin={coin} />
        </li>
      ))}
    </ul>
  );
}
