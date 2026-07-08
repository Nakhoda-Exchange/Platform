import {
  sparklineSeries,
  seedFromSymbol,
  sparklinePaths,
} from "@/lib/utils/sparkline";
import { cn } from "@/lib/utils/cn";

/**
 * A coin's mini price line — gain green / loss red (via currentColor, so it
 * tracks the theme), a soft area fill, and an emphasized endpoint. Decorative:
 * `aria-hidden`, since the percentage beside it already carries the meaning.
 */
export function Sparkline({
  symbol,
  up,
  width = 64,
  height = 26,
  className,
}: {
  symbol: string;
  up: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  const series = sparklineSeries(seedFromSymbol(symbol), up);
  const { line, area, end } = sparklinePaths(series, width, height);
  const gradId = `spark-${symbol}-${width}-${up ? "u" : "d"}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className={cn(up ? "text-gain" : "text-loss", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={end[0]} cy={end[1]} r="2" fill="currentColor" />
    </svg>
  );
}
