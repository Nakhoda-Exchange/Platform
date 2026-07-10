import { cn } from "@/lib/utils/cn";

/** Deterministic 0..1 series trending toward `up`, seeded from a symbol so a
 *  coin's line never changes. Self-contained to the marketing landing. */
function series(seed: number, up: boolean, n = 16): number[] {
  let s = seed >>> 0 || 1;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff;
  const start = 0.5;
  const end = up ? 0.82 : 0.18;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(
      Math.max(
        0.08,
        Math.min(0.92, start + (end - start) * t + (rnd() - 0.5) * 0.16),
      ),
    );
  }
  out[n - 1] = end;
  return out;
}

function seedFrom(symbol: string): number {
  let h = 0;
  for (const ch of symbol) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h || 1;
}

/** A tiny smooth price sparkline — gain green / loss red via currentColor. */
export function MiniSpark({
  symbol,
  up,
  width = 48,
  height = 20,
  className,
}: {
  symbol: string;
  up: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  const v = series(seedFrom(symbol), up);
  const pad = 2;
  const iw = width - pad * 2;
  const ih = height - pad * 2;
  const pts = v.map(
    (val, i) =>
      [pad + (i / (v.length - 1)) * iw, pad + (1 - val) * ih] as const,
  );
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i - 1] ?? pts[i];
    const b = pts[i];
    const c = pts[i + 1];
    const e = pts[i + 2] ?? c;
    d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  const end = pts[pts.length - 1];
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className={cn(up ? "text-gain" : "text-loss", className)}
    >
      <path
        d={`${d} L${(width - pad).toFixed(1)} ${height} L${pad} ${height} Z`}
        fill="currentColor"
        opacity="0.14"
      />
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle
        cx={end[0].toFixed(1)}
        cy={end[1].toFixed(1)}
        r="1.9"
        fill="currentColor"
      />
    </svg>
  );
}
