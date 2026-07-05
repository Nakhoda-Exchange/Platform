import { describe, expect, test } from "bun:test";
import { seededSeries } from "./seeded-series";

describe("seededSeries", () => {
  test("is deterministic for a given seed", () => {
    expect(seededSeries(42, 24, 1_000, 0.1)).toEqual(
      seededSeries(42, 24, 1_000, 0.1),
    );
  });

  test("pins the last point to end and stays positive", () => {
    const series = seededSeries(7, 30, 5_000, 0.5);
    expect(series).toHaveLength(30);
    expect(series.at(-1)).toBe(5_000);
    expect(series.every((v) => v > 0)).toBe(true);
  });
});
