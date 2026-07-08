/**
 * Deterministic mini price series for list/card sparklines, each value 0..1.
 * A gentle trend toward the 24h direction with light seeded jitter — it reads
 * as a real price line, not a noise field.
 * ponytail: derived from a seed + direction so it needs no backend series yet —
 * swap for a real `sparkline: number[]` from the market API when it lands (drop
 * this and feed the API values straight into `sparklinePaths`).
 */
export function sparklineSeries(
  seed: number,
  up: boolean,
  points = 18,
): number[] {
  let s = seed >>> 0 || 1;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff;
  const start = 0.5;
  const end = up ? 0.82 : 0.18;
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const trend = start + (end - start) * t; // clear direction
    const jitter = (rnd() - 0.5) * 0.16; // light wiggle around the trend
    out.push(Math.max(0.06, Math.min(0.94, trend + jitter)));
  }
  out[points - 1] = end; // clean finish that matches the sign
  return out;
}

/** Stable seed from a coin symbol, so a coin's sparkline never changes shape. */
export function seedFromSymbol(symbol: string): number {
  let h = 0;
  for (const ch of symbol) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h || 1;
}

/** Catmull-Rom → cubic-bezier: a smooth curve through the points (no overshoot
 *  worth caring about at sparkline scale), so the line reads soft, not jagged. */
function smoothLine(pts: readonly (readonly [number, number])[]): string {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]} ${pts[0][1]}` : "";
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** SVG smooth line + area paths (over a w×h box) for a normalized 0..1 series. */
export function sparklinePaths(
  series: number[],
  w: number,
  h: number,
  pad = 2.5,
): { line: string; area: string; end: readonly [number, number] } {
  const n = series.length;
  // Pad on both axes so the line's ends and the endpoint dot stay inside the
  // viewBox (an unpadded x=w endpoint gets its dot shaved at the right edge).
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const pts = series.map(
    (val, i) =>
      [pad + (i / (n - 1)) * innerW, pad + (1 - val) * innerH] as const,
  );
  const line = smoothLine(pts);
  const area = `${line} L${(w - pad).toFixed(1)} ${h} L${pad.toFixed(1)} ${h} Z`;
  return { line, area, end: pts[n - 1] };
}
