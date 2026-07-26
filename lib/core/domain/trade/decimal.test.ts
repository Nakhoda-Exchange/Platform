import { describe, expect, test } from "bun:test";
import {
  availableScaled,
  compareDecimal,
  formatScaled,
  toScaled,
} from "./decimal";

describe("trade decimal (issue #57)", () => {
  test("toScaled parses a decimal string exactly to ×10^18", () => {
    expect(toScaled("1")).toBe(BigInt(10) ** BigInt(18));
    expect(toScaled("0.0015")).toBe(BigInt("1500000000000000"));
    expect(toScaled("123.123456789012345678")).toBe(
      BigInt("123123456789012345678"),
    );
  });

  test("toScaled truncates beyond 18 fractional digits, rejects junk/negatives", () => {
    // 20 fractional digits → truncated to 18 (no rounding).
    expect(toScaled("0.12345678901234567899")).toBe(
      BigInt("123456789012345678"),
    );
    expect(toScaled("")).toBeNull();
    expect(toScaled("abc")).toBeNull();
    expect(toScaled("-1")).toBeNull();
  });

  test("formatScaled round-trips without float loss", () => {
    const raw = "123.123456789012345678";
    expect(formatScaled(toScaled(raw)!)).toBe(raw);
    expect(formatScaled(toScaled("5")!)).toBe("5");
    expect(formatScaled(BigInt(0))).toBe("0");
  });

  test("compareDecimal orders past float precision", () => {
    // These two differ only in the 18th decimal — a float would call them equal.
    expect(compareDecimal("1.000000000000000001", "1.000000000000000002")).toBe(
      -1,
    );
    expect(compareDecimal("2", "2")).toBe(0);
    expect(compareDecimal("10", "9.999999999999999999")).toBe(1);
    expect(compareDecimal("x", "1")).toBeNull();
  });

  test("availableScaled nets locked units and never goes negative", () => {
    expect(availableScaled(toScaled("1")!, toScaled("0.9")!)).toBe(
      toScaled("0.1")!,
    );
    expect(availableScaled(toScaled("0.5")!, toScaled("2")!)).toBe(BigInt(0));
  });
});
