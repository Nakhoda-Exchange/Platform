/**
 * Deterministic pseudo-random value walk that trends toward `end` and pins its
 * last point to `end` (the current value). Seeded so SSR and client agree.
 * Shared by the mock market and portfolio adapters; a real time-series API
 * replaces the call sites.
 */
export function seededSeries(
  seed: number,
  points: number,
  end: number,
  drift: number,
): number[] {
  let s = seed >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff;
  const start = end / (1 + drift);
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const base = start + (end - start) * t;
    const noise = (rnd() - 0.5) * end * 0.05;
    out.push(Math.max(base + noise, end * 0.0001));
  }
  out[points - 1] = end;
  return out;
}

/**
 * Bucket a fine-grained walk into OHLC candles: every `size` consecutive
 * values become one candle (open = first, close = last, high/low = extremes).
 * The invariants high ≥ max(open, close) and low ≤ min(open, close) hold by
 * construction.
 */
export function toCandles(
  values: number[],
  size: number,
): Array<{ open: number; high: number; low: number; close: number }> {
  const candles = [];
  for (let i = 0; i + size <= values.length; i += size) {
    const bucket = values.slice(i, i + size);
    candles.push({
      open: bucket[0],
      high: Math.max(...bucket),
      low: Math.min(...bucket),
      close: bucket[bucket.length - 1],
    });
  }
  return candles;
}
