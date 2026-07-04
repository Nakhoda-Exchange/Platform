import Link from "next/link";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinIcon } from "./coin-icon";
import { SectionHeader } from "./section-header";
import { SparklesIcon } from "@/components/ui/icons";
import { formatIrtShort } from "@/lib/utils/money";

/** «ارزهای جدید» — a horizontal strip of recently listed coins. */
export function NewCoins({ coins }: { coins: Coin[] }) {
  if (coins.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="ارزهای جدید" icon={<SparklesIcon size={18} />} />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4">
        {coins.map((coin) => (
          <Link
            key={coin.id}
            href={`/market/${coin.symbol.toLowerCase()}`}
            className="flex w-[150px] shrink-0 flex-col gap-2 rounded-2xl border border-line bg-white p-3.5 text-right"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                جدید
              </span>
              <CoinIcon coin={coin} size={34} />
            </div>
            <span className="text-[15px] font-bold text-ink">{coin.name}</span>
            <span className="text-[13px] text-muted">
              {formatIrtShort(coin.priceIrt)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
