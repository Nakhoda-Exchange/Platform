import Link from "next/link";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinIcon } from "@/components/market/coin-icon";
import { WalletIcon } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/button";
import { formatChangePercent, formatIrtShort } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/**
 * Shown when the account is truly empty (no coins, no cash). Guides the user
 * with the funnel order they actually need: deposit first (nothing to buy with
 * otherwise), then buy — and seeds discovery with a few popular coins so the
 * screen suggests something to buy rather than just showing two buttons.
 */
export function PortfolioEmpty({ suggestions }: { suggestions: Coin[] }) {
  return (
    <div className="flex flex-1 flex-col gap-7 px-4 pb-6 pt-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-brand/10 text-brand">
          <WalletIcon size={40} />
        </span>
        <h2 className="text-[20px] font-extrabold text-ink">
          هنوز دارایی‌ای نداری
        </h2>
        <p className="max-w-[300px] text-[15px] leading-[1.8] text-muted">
          اول تومان واریز کن، بعد اولین رمزارزت را بخر تا سبد دارایی‌ات این‌جا
          شکل بگیرد.
        </p>
      </div>

      {suggestions.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-[15px] font-bold text-ink">پیشنهاد برای شروع</h3>
          <ul className="-mx-4 flex flex-col divide-y divide-line">
            {suggestions.map((coin) => {
              const up = coin.change24h >= 0;
              return (
                <li key={coin.id}>
                  <Link
                    href={`/market/${coin.symbol.toLowerCase()}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface"
                  >
                    <span className="flex items-center gap-3">
                      <CoinIcon coin={coin} size={40} />
                      <span className="flex flex-col">
                        <span className="text-[15px] font-bold text-ink">
                          {coin.name}
                        </span>
                        <span className="text-[12px] text-muted" dir="ltr">
                          {coin.symbol}
                        </span>
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-0.5">
                      <span className="text-[14px] font-bold text-ink">
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
                        {formatChangePercent(coin.change24h)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="mt-auto flex flex-col gap-2.5">
        <Link
          href="/wallet/deposit"
          className={buttonClasses({ size: "xl", fullWidth: true })}
        >
          واریز تومان
        </Link>
        <Link
          href="/market"
          className={buttonClasses({
            variant: "ghost",
            size: "xl",
            fullWidth: true,
            className: "bg-surface",
          })}
        >
          مشاهده همه ارزها
        </Link>
      </div>
    </div>
  );
}
