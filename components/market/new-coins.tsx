import Link from "next/link";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinIcon } from "./coin-icon";
import { SectionHeader } from "./section-header";
import { SparklesIcon } from "@/components/ui/icons";
import { formatChangePercent, formatIrtShort } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/**
 * «ارزهای جدید» — a horizontal strip of recently listed coins as compact chips
 * (icon + symbol + price + 24h change). No per-card «جدید» badge: the section
 * header already says these are new, so each chip spends its space on the
 * signal that actually helps — how the listing is moving.
 */
export function NewCoins({ coins }: { coins: Coin[] }) {
  if (coins.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="ارزهای جدید" icon={<SparklesIcon size={18} />} />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4">
        {coins.map((coin) => {
          const up = coin.change24h >= 0;
          return (
            <Link
              key={coin.id}
              href={`/market/${coin.symbol.toLowerCase()}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-paper px-3 py-2"
            >
              <CoinIcon coin={coin} size={24} />
              <span className="text-[13px] font-bold text-ink">
                {coin.symbol}
              </span>
              <span className="text-[12px] text-muted">
                {formatIrtShort(coin.priceIrt)}
              </span>
              <span
                dir="ltr"
                aria-label={`${up ? "افزایش" : "کاهش"} ${formatChangePercent(coin.change24h)} در ۲۴ ساعت`}
                className={cn(
                  "text-[12px] font-bold",
                  up ? "text-gain" : "text-loss",
                )}
              >
                {up ? "▲" : "▼"} {formatChangePercent(coin.change24h)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
