"use client";

import { useEffect, useRef, useState } from "react";
import { formatIrt } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

const TICK_MS = 1_600;
const STEP = 0.003; // per-tick nudge, ±0.3%
const MAX_DRIFT = 0.02; // leash to ±2% of the real price

/**
 * Centered "market is live" price chip for the trade screen: the server price
 * ticks via a leashed random walk (same simulation as the PDP chart) and a
 * pulsing dot signals the feed is live.
 *
 * Display only — the order math stays server-authoritative at `coin.priceIrt`;
 * this chip never feeds the conversion or the confirm step.
 */
export function LivePriceChip({ basePrice }: { basePrice: number }) {
  const driftRef = useRef(0);
  const [price, setPrice] = useState(basePrice);

  useEffect(() => {
    const id = setInterval(() => {
      const step = (Math.random() - 0.5) * 2 * STEP;
      driftRef.current = Math.min(
        MAX_DRIFT,
        Math.max(-MAX_DRIFT, driftRef.current + step),
      );
      setPrice(Math.round(basePrice * (1 + driftRef.current)));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [basePrice]);

  // Green while trading above the reference price (pumping), red below
  // (dumping). Colour-only by request; the aria-label still names the
  // direction for screen readers.
  const up = price >= basePrice;

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
