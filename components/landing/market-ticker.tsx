import { ArrowUpIcon, ArrowDownIcon } from "@/components/ui/icons";
import { ALL_COINS, type LandingCoin } from "./coins";
import { cn } from "@/lib/utils/cn";

/** Soft edge fade so pills dissolve at both ends instead of hard-cutting.
 *  Both the standard and -webkit- properties are set so it works in WebKit. */
const EDGE_FADE = {
  maskImage:
    "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
} as const;

/** A coin pill for the marquee — real logo, symbol, and 24h change. Flat (no
 *  drop-shadow) so a row of them can animate without repaint jank. */
function CoinPill({ coin }: { coin: LandingCoin }) {
  return (
    <span className="flex shrink-0 items-center gap-2.5 rounded-full border border-line bg-paper py-2 pe-4 ps-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coin.icon}
        alt=""
        width={30}
        height={30}
        className="size-[30px] rounded-full object-cover"
      />
      <span dir="ltr" className="text-[15px] font-extrabold text-ink">
        {coin.sym}
      </span>
      <span
        className={cn(
          "flex items-center gap-0.5 text-[13px] font-extrabold tabular-nums",
          coin.up ? "text-gain" : "text-loss",
        )}
      >
        {coin.up ? <ArrowUpIcon size={12} /> : <ArrowDownIcon size={12} />}
        {coin.ch}٪
      </span>
    </span>
  );
}

/** One tiling copy of a row. `pe-3` matches the internal gap so two copies
 *  tile edge-to-edge and the −50% loop lands exactly one copy over. */
function Strip({ coins }: { coins: LandingCoin[] }) {
  return (
    <div className="flex shrink-0 gap-3 pe-3">
      {coins.map((c) => (
        <CoinPill key={c.sym} coin={c} />
      ))}
    </div>
  );
}

/**
 * Two rows of coin pills drifting in opposite directions — a lively market
 * horizon that fades softly at both edges. Decorative sample data (the app is
 * the real thing), so it's aria-hidden; reduced-motion holds both rows still.
 */
export function MarketTicker() {
  const row1 = ALL_COINS;
  const row2 = [...ALL_COINS].reverse();
  return (
    <div
      aria-hidden
      className="flex flex-col gap-2.5 overflow-hidden border-y border-line bg-surface py-4"
      style={EDGE_FADE}
    >
      <div className="flex w-max animate-ticker will-change-transform">
        <Strip coins={row1} />
        <Strip coins={row1} />
      </div>
      <div className="flex w-max animate-ticker-reverse will-change-transform">
        <Strip coins={row2} />
        <Strip coins={row2} />
      </div>
    </div>
  );
}
