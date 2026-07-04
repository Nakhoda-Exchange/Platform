import type { Coin } from "@/lib/core/domain/market/coin";
import { cn } from "@/lib/utils/cn";

/**
 * Coin logo. Uses the coin's real icon (public/coins/*.png); falls back to a
 * brand letter-badge when there's no icon. A coin's logo is identity, so real
 * logos are the one deliberate exception to the blue-only palette.
 */
export function CoinIcon({
  coin,
  size = 40,
  className,
}: {
  coin: Pick<Coin, "iconUrl" | "symbol">;
  size?: number;
  className?: string;
}) {
  if (coin.iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coin.iconUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand/10 font-bold text-brand",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {coin.symbol.charAt(0)}
    </span>
  );
}
