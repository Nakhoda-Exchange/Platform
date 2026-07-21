import { describe, expect, test } from "bun:test";
import { computeWithdrawFee } from "./wallet-config";

describe("computeWithdrawFee", () => {
  test("applies the basis-point rate below the cap", () => {
    // 1% (100 bps) of 1,000,000 = 10,000, under a 50,000 cap.
    expect(computeWithdrawFee(1_000_000, 100, 50_000)).toBe(10_000);
  });

  test("caps the fee at feeCapIrt", () => {
    // 1% of 10,000,000 = 100,000, capped to 50,000.
    expect(computeWithdrawFee(10_000_000, 100, 50_000)).toBe(50_000);
  });

  test("is zero when the rate is zero (free withdrawals)", () => {
    expect(computeWithdrawFee(1_000_000, 0, 50_000)).toBe(0);
  });

  test("ignores the cap when it is zero (uncapped rate)", () => {
    expect(computeWithdrawFee(1_000_000, 100, 0)).toBe(10_000);
  });

  test("is zero for a non-positive or non-finite amount", () => {
    expect(computeWithdrawFee(0, 100, 50_000)).toBe(0);
    expect(computeWithdrawFee(-5, 100, 50_000)).toBe(0);
    expect(computeWithdrawFee(Number.NaN, 100, 50_000)).toBe(0);
  });
});
