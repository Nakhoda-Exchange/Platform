"use client";

import { parsePrice, type PriceValue } from "@/lib/core/domain/market/price";
import { formatIrt } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import { useLivePrices } from "@/lib/realtime/use-realtime";

/**
 * Centered "market is live" price chip for the trade screen. Shows the REAL
 * price and updates ONLY when a live WebSocket price tick arrives — never a
 * simulated/random movement. Until the first tick, it holds the server price
 * (`basePrice`). A pulsing dot signals the feed; green/red shows the live price
 * relative to the price when the screen loaded.
 *
 * Display only — the order math stays server-authoritative at `coin.priceIrt`;
 * this chip never feeds the conversion or the confirm step.
 *
 * `basePrice` is the REST price in its wire form (a nullable decimal string).
 * When there is neither a live tick nor a usable base price, the chip shows a
 * neutral «قیمت در دسترس نیست» — never a fabricated 0.
 */
export function LivePriceChip({
  coinId,
  basePrice,
}: {
  coinId: string;
  basePrice: PriceValue;
}) {
  const { prices } = useLivePrices();
  const tick = prices[coinId];
  const base = parsePrice(basePrice);
  const price = tick ? tick.priceIrt : base;

  // No live tick and no usable reference price → say so plainly, don't fake a
  // number or a direction.
  if (price === null) {
    return (
      <div className="flex justify-center">
        <div
          className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-[14px] font-bold text-muted"
          aria-label="قیمت زنده بازار در دسترس نیست"
        >
          قیمت در دسترس نیست
        </div>
      </div>
    );
  }

  // Green when the live price is at/above the load-time reference, red below.
  // Colour-only by request; the aria-label still names the direction. With no
  // reference (base unavailable but a tick arrived) default to the calm "up".
  const up = base === null ? true : price >= base;

  return (
    <div className="flex justify-center">
      <div
        dir="ltr"
        aria-label={`قیمت زنده بازار، ${up ? "در حال رشد" : "در حال ریزش"}`}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-1.5",
          up ? "bg-gain-soft" : "bg-loss-soft",
        )}
      >
        <span className="relative flex size-2" aria-hidden>
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:hidden",
              up ? "bg-gain" : "bg-loss",
            )}
          />
          <span
            className={cn(
              "relative inline-flex size-2 rounded-full",
              up ? "bg-gain" : "bg-loss",
            )}
          />
        </span>
        <span
          className={cn(
            "text-[15px] font-extrabold tabular-nums",
            up ? "text-gain" : "text-loss",
          )}
        >
          {formatIrt(price)}
        </span>
      </div>
    </div>
  );
}
