import { expect, test } from "bun:test";
import { sparklineSeries, seedFromSymbol, sparklinePaths } from "./sparkline";

test("series has the requested length and stays in [0,1]", () => {
  const s = sparklineSeries(seedFromSymbol("BTC"), true, 24);
  expect(s).toHaveLength(24);
  for (const v of s) expect(v).toBeGreaterThanOrEqual(0);
  for (const v of s) expect(v).toBeLessThanOrEqual(1);
});

test("deterministic: same seed + direction → identical series", () => {
  const a = sparklineSeries(seedFromSymbol("ETH"), false);
  const b = sparklineSeries(seedFromSymbol("ETH"), false);
  expect(a).toEqual(b);
});

test("end agrees with direction (up ⇒ ends at the max, down ⇒ at the min)", () => {
  const up = sparklineSeries(123, true);
  expect(up[up.length - 1]).toBe(Math.max(...up));
  const down = sparklineSeries(123, false);
  expect(down[down.length - 1]).toBe(Math.min(...down));
});

test("seedFromSymbol is stable and non-zero", () => {
  expect(seedFromSymbol("SOL")).toBe(seedFromSymbol("SOL"));
  expect(seedFromSymbol("SOL")).toBeGreaterThan(0);
  expect(seedFromSymbol("")).toBe(1); // empty → fallback seed, never 0
});

test("paths: endpoint sits near the right edge but fully inside the box", () => {
  const series = sparklineSeries(7, true, 12);
  const { line, area, end } = sparklinePaths(series, 64, 26);
  expect(line.startsWith("M")).toBe(true);
  expect(area.endsWith("Z")).toBe(true);
  // padded in on both axes so the endpoint dot never clips
  expect(end[0]).toBeGreaterThan(58);
  expect(end[0]).toBeLessThanOrEqual(64);
  expect(end[1]).toBeGreaterThanOrEqual(0);
  expect(end[1]).toBeLessThanOrEqual(26);
});
