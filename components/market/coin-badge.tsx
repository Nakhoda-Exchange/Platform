interface CoinBadgeProps {
  symbol: string;
  size?: number;
}

/**
 * Coin icon — a brand-tinted letter badge (blue-only, per the Nakhoda UX guide).
 * The Coin model carries an iconUrl for the future, but we intentionally don't
 * render external colorful logos while the palette is blue-only.
 */
export function CoinBadge({ symbol, size = 40 }: CoinBadgeProps) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-brand/10 font-bold text-brand"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {symbol.charAt(0)}
    </span>
  );
}
